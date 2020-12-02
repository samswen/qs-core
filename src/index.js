'use strict';

module.exports = {
    parse_query
};

const operators = [ 'eq', 'ne', 'bt', 'gt', 'gte', 'lte', 'lt', 'regex'];
const pagination_keys = [ 'sort', 'page_no', 'page_size' ];
const page_no_default = 1;
const page_size_default = 1;

function parse_query(query_vars, cfg, variables_template, get_variables, transform_name, messages) {
    const name_values = {};
    if (!get_variables && variables_template) {
        get_variables = (x) => variables_template[x];
    }
    if (!cfg) {
        cfg = {};
    }
    const opts = { variables_template, get_variables, transform_name, cfg, messages };
    for (const key in query_vars) {
        const { name, value, op } = get_name_value_op(key, query_vars[key]);
        const transformed_name = transform_name ? transform_name(name, cfg) : name;
        const variable = validate_name_op(transformed_name, op, opts);
        if (variable) {
            transform_value(variable, transformed_name, value, op, name_values);
        }
    }
    const matrix = build_matrix(name_values, opts);
    const matrix_query = get_matrix_query(matrix);
    const query = get_query(matrix_query, cfg);
    const result = {query, ...cfg };
    const pagination = get_pagination(matrix_query, opts);
    if (pagination) {
        result.pagination = pagination;
    }
    return result;
}

function get_name_value_op(key, value) {
    let name = key;
    let op = 'eq';
    if (!value) {
        let parts = null;
        if (key.includes('<>')) {
            op = 'bt';
            parts = key.split('<>');
        } else if (key.includes('>')) {
            op = 'gt';
            parts = key.split('>');
        } else if (key.includes('<')) {
            op = 'lt';
            parts = key.split('<');
        }
        if (parts && parts.length === 2) {
            name = parts[0];
            value = parts[1].trim();
        }
    } else if (key.endsWith('!')) {
        op = 'ne';
        name = key.substr(0, key.length-1);
    } else if (key.endsWith('<')) {
        op = 'lte';
        name = key.substr(0, key.length-1);
    } else if (key.endsWith('>')) {
        op = 'gte';
        name = key.substr(0, key.length-1);
    } else if (key.endsWith('$')) {
        op = 'regex';
        name = key.substr(0, key.length-1);
    }
    if (value === 'null' || value === 'NULL') {
        value = null;
    }
    return {name, value, op};
}

function validate_name_op(name, op, opts) {
    if (!name) {
        opts.messages.push('invalid empty name');
        return null;
    }
    if (!opts.get_variables) {
        return {};
    }
    const variable = opts.get_variables(name, opts.cfg);
    if (!variable) {
        if (pagination_keys.includes(name)) {
            if (name === 'sort') {
                return {};
            } else {
                return {transfn: Number};
            }
        } else {
            opts.messages.push('skipped, variable not found ' + name);
            return null;
        }
    }
    if (variable.read_only) {
        opts.messages.push('skipped, readonly for ' + name);
        return null;
    }
    if (pagination_keys.includes(name) && op !== 'eq') {
        opts.messages.push('pagination key takes = operator only');
        return null;
    }
    return variable;
}

function get_matrix_query(matrix) {
    const matrix_query = {};
    for (const key in matrix) {
        const val = matrix[key];
        const value = {};
        for (let i = 0; i < operators.length; i++) {
            if (val[i]) {
                value[operators[i]] = val[i];
            }
        }
        if (Object.keys(value).length > 0) {
            matrix_query[key] = value;
        }
    }
    return matrix_query;
}

function get_query(matrix_query) {
    const query = {};
    for (const key in matrix_query) {
        if (pagination_keys.includes(key)) {
            continue;
        }
        query[key] = matrix_query[key];
    }
    return  query;
}

function build_matrix(name_values, opts) {
    if (opts && opts.variables_template) {                   // to get default value event if the key is not defined               
        for (const name in opts.variables_template) {        
            if (name_values[name]) {                         // key is defined and has values, no default is needed
                continue;
            }
            let variable = opts.variables_template[name];
            if (variable.default === undefined) {             // not default
                continue;
            }
            if (opts.cfg[name]) {                             // already defined in cfg
                if (pagination_keys.includes(name)) {         // pagination keys in cfg are in parsed form
                    continue;
                }
                if (typeof opts.cfg[name] !== 'object') {
                    variable = { default: opts.cfg[name]};
                } else {
                    variable = opts.cfg[name];
                }
            }
            get_default_values(name_values, name, variable, opts.messages);
        }
    }
    const matrix = {};
    for (const name in name_values) {
        if (name === 'sort' && name_values[name][0]) {
            get_sort_values(name_values, matrix, opts, opts.messages);
        } else {
            get_query_values(name_values, name, matrix, opts.messages);
        }
    }
    return matrix;
}

/**
 *  acceptable default variable: 
 *  1) { default: 'x' }
 *  2) { default: 100, default_op: '>' }
 *  3) { default: ['x', 'y'], default_op: 'eq' }
 *  4) { default: [1, 100], default_op: 'bt' }
 *  5) { default: {x: 1, y: -1} }   // for sort only
 *  6) { default: ['x', 1, 'y', -1] }   // for sort too
 */
function get_default_values(name_values, name, variable, messages) {
    let op = 'eq';
    if (variable.default_op) {
        op = variable.default_op;
    }
    if (pagination_keys.includes(name) && op !== 'eq') {
        messages.push('wrong default in variable(1), pagination key takes eq operator only');
        return false;
    }
    const index = operators.indexOf(op);
    if (index < 0) {
        messages.push('not supported op: ' + op);
        return false;
    }
    name_values[name] = new Array(operators.length);
    if (index > 2 && index !== 7) {                         // 3 = gt  4 = gte  5 = lte  6 = lt => single value
        if (Array.isArray(variable.default)) {
            name_values[name][index] = variable.default[0];
            messages.push('use default[0] only for ' + name);
        } else {
            name_values[name][index] = variable.default;
        }
    } else {
        const values = [];
        if (Array.isArray(variable.default)) {
            for (const value of variable.default) {
                if (typeof value === 'object') {
                    messages.push('wrong default in variable(2), object type not allowed');  
                    return false;
                } else {
                    values.push(value);
                }
            }
            name_values[name][index] = values;
        } else {
            if (typeof variable.default === 'object') {
                if (index === 0 && name === 'sort') {
                    for (const key in variable.default) {
                        values.push(key, variable.default[key]);
                    }
                } else {
                    messages.push('wrong default in variable(3), object type not allowed');  
                    return false;
                }
            } else {
                values.push(variable.default);
            }
        }
        name_values[name][index] = values;
    }
    return true;
}

function get_query_values(name_values, name, matrix, messages) {
    for (let i = 0; i < 2; i++) { // 0 = eq  1 = ne
        if (name_values[name][i]) {
            const prev_size = name_values[name][i].length;
            name_values[name][i] = [...new Set(name_values[name][i])];
            if (messages && name_values[name][i].length < prev_size) {
                messages.push('one or more value item removed due to duplicated for ' + name);
            }
        }
        const j = 2 * i + 3;
        if (name_values[name][j] && name_values[name][j+1] && name_values[name][j] <= name_values[name][j+1]) { 
            if (i === 0) { // keep max
                name_values[name][j] = null;
                messages.push('both > and >= exist, keep the max one for ' + name);
            } else {       // keep min
                name_values[name][j+1] = null;
                messages.push('both < and <= exist, keep the min one for ' + name);
            }
        }
    }
    let has_value = false;
    for (let i = 0; i < operators.length; i++) {
        if (name_values[name][i] !== null) {
            has_value = true;
            break;
        }
    }
    if (has_value) {
        matrix[name] = name_values[name];
    } else {
        messages.push('skipped, due no value for ' + name);
    }
}

function parse_sort_array(values, opts) {
    const result = [];
    let expect_direction = false;
    for (const value of values) {
        if (!isNaN(value)) {
            const number = Number(value);
            if (number === 1 || number === -1) {
                if (expect_direction) {
                    result.push(number);
                    expect_direction = false;
                    continue;
                }
            }
            opts.messages.push('skipped, unexpected ' + value);
            continue;
        }
        if (expect_direction) {
            result.push(1);
        }
        if (opts && opts.get_variables && opts.transform_name) {
            const full_name = opts.transform_name(value, opts.cfg);
            if (opts.get_variables(full_name, opts.cfg)) {
                result.push(full_name);
                expect_direction = true;
            } else {
                opts.messages.push('skipped, sort by field not allowed: ' + value);
            }
        } else {
            result.push(value);
            expect_direction = true;
        }
    }
    if (expect_direction) {
        result.push(1);
    }
    return result;
}

function get_sort_values(name_values, matrix, opts) {
    const new_value = parse_sort_array(name_values.sort[0], opts);
    if (new_value  && new_value.length > 0) {
        matrix.sort = [ new_value ];
    } else {
        opts.messages.push('skipped, due no value for sort');
    }
}

function default_transfn(x) {
    if (typeof x !== 'number' && !isNaN(x)) {
        return Number(x);
    } else if (typeof x === 'string') {
        return x.trim();
    } else {
        return x;
    }
}

function transform_value(variable, name, value, op, name_values) {
    let transfn = default_transfn;
    if (variable.transfn && typeof variable.transfn === 'function') {
        transfn = variable.transfn;
    }
    if (Array.isArray(value)) {
        const parts = value;
        value = [];
        for (const part of parts) {
            if (typeof part === 'string' && part.includes('|')) {
                const parts2 = part.split('|');
                for (const part2 of parts2) {
                    value.push(transfn(part2));
                }
            } else {
                    value.push(transfn(part));
            }
        }
    } else if (op !== 'regex' && typeof value === 'string' && value.includes('|')) {
        const parts = value.split('|');
        value = [];
        for (const part of parts) {
            value.push(transfn(part.trim()));
        }
    } else {
        if (typeof value === 'string') {
            value = value.trim();
        }
        value = [ transfn(value) ];
    }
    if (!value || value.length === 0) {
        return false;
    }
    if (!name_values[name]) {
        name_values[name] = new Array(operators.length);
    }
    const index = operators.indexOf(op);
    // 0 = eq  1 = ne  2 = bt  3 = gt  4 = gte  5 = lte  6 = lt 7 = regex
    if (index < 0) {
        return false;
    } else if (index > 2 && index !== 7) { // 3 = gt  4 = gte  5 = lte  6 = lt => single value
        if (!name_values[name][index]) {
            if (value.length === 1) {
                name_values[name][index] = value[0];
            } else if (value.length > 1) {
                if (index > 4) {  // 5 = lte  6 = lt
                    name_values[name][index] = Math.min(...value);
                } else {          // 3 = gt  4 = gte 
                    name_values[name][index] = Math.max(...value);
                }
            }
        } else {
            if (index > 4) {      // 5 = lte  6 = lt
                name_values[name][index] = Math.min(name_values[name][index], ...value);
            } else {              //  3 = gt  4 = gte 
                name_values[name][index] = Math.max(name_values[name][index], ...value);
            }
        }
    } else { // 0 = eq  1 = ne  2 = bt 7 = regex
        if (!name_values[name][index]) {
            name_values[name][index] = value;
        } else {
            name_values[name][index].push(...value);
        }
    }
    return true;
}

function get_pagination(matrix_query, opts) {
    let has_page_key = false;
    let has_sort_key = false;
    for (const key of pagination_keys) {
        if (key === 'sort') {
            has_sort_key = true;
            continue;
        }
        if (matrix_query[key]) {
            has_page_key = true;
            break;
        }
    }
    if (!has_page_key && !has_sort_key) {
        return null;
    }
    const pagination = {};
    for (const key of pagination_keys) {
        const value = matrix_query[key];
        if (!value || !value.eq || value.eq.length === 0) {
            if (key === 'sort') {
                if (has_sort_key && opts.cfg[key]) {
                    pagination[key] = convert_array_to_object(opts.cfg[key]);
                }
            } else if (has_page_key) {
                if (opts.cfg[key]) {
                    pagination[key] = opts.cfg[key];
                } else {
                    pagination[key] = page_size_default;
                }
            } 
        } else if (key === 'sort') {
            if (has_sort_key) {
                pagination[key] = convert_array_to_object(value.eq);
            }
        } else if (has_page_key) {
            const index = value.eq.length - 1;
            pagination[key] = value.eq[index];
        }
    }
    return pagination;
}

function convert_array_to_object(array) {
    const object = {};
    for (let i = 0; i < array.length; i += 2) {
        object[array[i]] = array[i+1];
    }
    return object;
}
