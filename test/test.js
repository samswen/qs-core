const chai = require('chai');
//const assert = chai.assert;
const expect = chai.expect;

const qs_core = require('../src');

describe('Test qs-core', () => {

    it('test parse_query case 1: simple = and =s', async () => {
        const query_vars = {
            x: 'abc',
            y: '123',
            z: ['a', 'b', 'c']
        };
        const messages = [];
        const result = qs_core.parse_query(query_vars, {}, null, null, null, messages);
        //console.log(JSON.stringify(result, null, 2));
        //console.log(JSON.stringify(messages, null, 2));
        expect(result).to.not.equal(null);
        expect(result).to.have.property('query');
        expect(result.query).to.deep.equal({x: {eq: ['abc']}, y: {eq: [123]}, z: {eq: ['a', 'b', 'c']}});
        expect(messages.length).equals(0);
    });

    it('test parse_query case 2: simple = and =s with page_no', async () => {
        const query_vars = {
            x: 'abc',
            y: '123',
            z: ['a', 'b', 'c'],
            page_no: 1
        };
        const messages = [];
        const result = qs_core.parse_query(query_vars, {}, null, null, null, messages);
        //console.log(JSON.stringify(result, null, 2));
        //console.log(JSON.stringify(messages, null, 2));
        expect(result).to.not.equal(null);
        expect(result).to.have.property('query');
        expect(result).to.have.property('pagination');
        expect(result.query).to.deep.equal({x: {eq: ['abc']}, y: {eq: [123]}, z: {eq: ['a', 'b', 'c']}});
        expect(result.pagination).to.deep.equal({page_no: 1});
        expect(messages.length).equals(0);
    });

    it('test parse_query case 3: transfn and |', async () => {
        const variables_template = {
            x: {transfn: (x) =>  x + '_added'},
            y: {transfn: (x) => x},
            z: {}
        };
        const query_vars = {
            x: 'abc',
            y: '123',
            z: 'a|b|c'
        };
        const messages = [];
        const result = qs_core.parse_query(query_vars, {}, variables_template, null, null, messages);
        //console.log(JSON.stringify(result, null, 2));
        //console.log(JSON.stringify(messages, null, 2));
        expect(result).to.not.equal(null);
        expect(result).to.have.property('query');
        expect(result.query).to.deep.equal({x: {eq: ['abc_added']}, y: {eq: ['123']}, z: {eq: ['a', 'b', 'c']}});
        expect(messages.length).equals(0);
    });

    it('test parse_query case 4: transfn and | with page_size', async () => {
        const variables_template = {
            x: {transfn: (x) =>  x + '_added'},
            y: {transfn: (x) => x},
            z: {},
        };
        const query_vars = {
            x: 'abc',
            y: '123',
            z: 'a|b|c',
            page_size: 10,
        };
        const messages = [];
        const result = qs_core.parse_query(query_vars, {}, variables_template, null, null, messages);
        //console.log(JSON.stringify(result, null, 2));
        //console.log(JSON.stringify(messages, null, 2));
        expect(result).to.not.equal(null);
        expect(result).to.have.property('query');
        expect(result).to.have.property('pagination');
        expect(result.query).to.deep.equal({x: {eq: ['abc_added']}, y: {eq: ['123']}, z: {eq: ['a', 'b', 'c']}});
        expect(result.pagination).to.deep.equal({page_size: 10});
        expect(messages.length).equals(0);
    });

    it('test parse_query case 5: transfn and | with sort', async () => {
        const variables_template = {
            x: {transfn: (x) =>  x + '_added'},
            y: {transfn: (x) => x},
            z: {},
        };
        const query_vars = {
            x: 'abc',
            y: '123',
            z: 'a|b|c',
            sort: 'price|-1',
        };
        const messages = [];
        const result = qs_core.parse_query(query_vars, {}, variables_template, null, null, messages);
        //console.log(JSON.stringify(result, null, 2));
        //console.log(JSON.stringify(messages, null, 2));
        expect(result).to.not.equal(null);
        expect(result).to.have.property('query');
        expect(result).to.have.property('pagination');
        expect(result.query).to.deep.equal({x: {eq: ['abc_added']}, y: {eq: ['123']}, z: {eq: ['a', 'b', 'c']}});
        expect(result.pagination).to.deep.equal({sort: {price: -1}, sort_default: false});
        expect(messages.length).equals(0);
    });

    it('test parse_query case 6: >', async () => {
        const query_vars = {
            'x>100': '',
        };
        const messages = [];
        const result = qs_core.parse_query(query_vars, {}, null, null, null, messages);
        //console.log(JSON.stringify(result, null, 2));
        //console.log(JSON.stringify(messages, null, 2));
        expect(result).to.not.equal(null);
        expect(result).to.have.property('query');
        expect(result.query).to.deep.equal({x: {gt: 100}});
        expect(messages.length).equals(0);
    });

    it('test parse_query case 7: >=', async () => {
        const query_vars = {
            'x>': '100',
        };
        const messages = [];
        const result = qs_core.parse_query(query_vars, {}, null, null, null, messages);
        //console.log(JSON.stringify(result, null, 2));
        //console.log(JSON.stringify(messages, null, 2));
        expect(result).to.not.equal(null);
        expect(result).to.have.property('query');
        expect(result.query).to.deep.equal({x: {gte: 100}});
        expect(messages.length).equals(0);
    });

    it('test parse_query case 8: <', async () => {
        const query_vars = {
            'x<100': '',
        };
        const messages = [];
        const result = qs_core.parse_query(query_vars, {}, null, null, null, messages);
        //console.log(JSON.stringify(result, null, 2));
        //console.log(JSON.stringify(messages, null, 2));
        expect(result).to.not.equal(null);
        expect(result).to.have.property('query');
        expect(result.query).to.deep.equal({x: {lt: 100}});
        expect(messages.length).equals(0);
    });

    it('test parse_query case 9: >=', async () => {
        const query_vars = {
            'x<': '100',
        };
        const messages = [];
        const result = qs_core.parse_query(query_vars, {}, null, null, null, messages);
        //console.log(JSON.stringify(result, null, 2));
        //console.log(JSON.stringify(messages, null, 2));
        expect(result).to.not.equal(null);
        expect(result).to.have.property('query');
        expect(result.query).to.deep.equal({x: {lte: 100}});
        expect(messages.length).equals(0);
    });

    it('test parse_query case 10: !=', async () => {
        const query_vars = {
            'x!': '100',
        };
        const messages = [];
        const result = qs_core.parse_query(query_vars, {}, null, null, null, messages);
        //console.log(JSON.stringify(result, null, 2));
        //console.log(JSON.stringify(messages, null, 2));
        expect(result).to.not.equal(null);
        expect(result).to.have.property('query');
        expect(result.query).to.deep.equal({x: {ne: [100]}});
        expect(messages.length).equals(0);
    });

    it('test parse_query case 11: <> (between)', async () => {
        const query_vars = {
            'x<>100|200': '',
        };
        const messages = [];
        const result = qs_core.parse_query(query_vars, {}, null, null, null, messages);
        //console.log(JSON.stringify(result, null, 2));
        //console.log(JSON.stringify(messages, null, 2));
        expect(result).to.not.equal(null);
        expect(result).to.have.property('query');
        expect(result.query).to.deep.equal({x: {bt: [100, 200]}});
        expect(messages.length).equals(0);
    });

    it('test parse_query case 12: $= (regex)', async () => {
        const query_vars = {
            'x$': 'diamond.*$',
        };
        const messages = [];
        const result = qs_core.parse_query(query_vars, {}, null, null, null, messages);
        //console.log(JSON.stringify(result, null, 2));
        //console.log(JSON.stringify(messages, null, 2));
        expect(result).to.not.equal(null);
        expect(result).to.have.property('query');
        expect(result.query).to.deep.equal({x: {regex: ['diamond.*$']}});
        expect(messages.length).equals(0);
    });

    it('test parse_query case 13: multiple >=s', async () => {
        const query_vars = {
            'x>': ['100', '200', '300'],
        };
        const messages = [];
        const result = qs_core.parse_query(query_vars, {}, null, null, null, messages);
        //console.log(JSON.stringify(result, null, 2));
        //console.log(JSON.stringify(messages, null, 2));
        expect(result).to.not.equal(null);
        expect(result).to.have.property('query');
        expect(result.query).to.deep.equal({x: {gte: 300}});
        expect(messages.length).equals(0);
    });

    it('test parse_query case 14: multiple >s', async () => {
        const query_vars = {
            'x>100': '',
            'x>200': '',
            'x>300': ''
        };
        const messages = [];
        const result = qs_core.parse_query(query_vars, {}, null, null, null, messages);
        //console.log(JSON.stringify(result, null, 2));
        //console.log(JSON.stringify(messages, null, 2));
        expect(result).to.not.equal(null);
        expect(result).to.have.property('query');
        expect(result.query).to.deep.equal({x: {gt: 300}});
        expect(messages.length).equals(0);
    });

    it('test parse_query case 15: multiple <=s', async () => {
        const query_vars = {
            'x<': ['100', '200', '300'],
        };
        const messages = [];
        const result = qs_core.parse_query(query_vars, {}, null, null, null, messages);
        //console.log(JSON.stringify(result, null, 2));
        //console.log(JSON.stringify(messages, null, 2));
        expect(result).to.not.equal(null);
        expect(result).to.have.property('query');
        expect(result.query).to.deep.equal({x: {lte: 100}});
        expect(messages.length).equals(0);
    });

    it('test parse_query case 16: multiple <s', async () => {
        const query_vars = {
            'x<100': '',
            'x<200': '',
            'x<300': ''
        };
        const messages = [];
        const result = qs_core.parse_query(query_vars, {}, null, null, null, messages);
        //console.log(JSON.stringify(result, null, 2));
        //console.log(JSON.stringify(messages, null, 2));
        expect(result).to.not.equal(null);
        expect(result).to.have.property('query');
        expect(result.query).to.deep.equal({x: {lt: 100}});
        expect(messages.length).equals(0);
    });

    it('test parse_query case 17: transform_name', async () => {
        const query_vars = {
            'x': '100',
            'y': 'abc',
        };
        const transform_name = (x) => x === 'x' ? 'XXX' : x;
        const messages = [];
        const result = qs_core.parse_query(query_vars, null, null, null, transform_name, messages);
        //console.log(JSON.stringify(result, null, 2));
        //console.log(JSON.stringify(messages, null, 2));
        expect(result).to.not.equal(null);
        expect(result).to.have.property('query');
        expect(result.query).to.deep.equal({XXX: {eq: [100]}, y: {eq: ['abc']}});
        expect(messages.length).equals(0);
    });

    it('test parse_query case 18: get_variables', async () => {
        const query_vars = {
            'x': '100',
            'y': 'abc',
        };
        const get_variables = (x) => x === 'x' ? {} : null;
        const messages = [];
        const result = qs_core.parse_query(query_vars, null, null, get_variables, null, messages);
        //console.log(JSON.stringify(result, null, 2));
        //console.log(JSON.stringify(messages, null, 2));
        expect(result).to.not.equal(null);
        expect(result).to.have.property('query');
        expect(result.query).to.deep.equal({x: {eq: [100]}});
        expect(messages.length).equals(1);
        expect(messages).to.deep.equal(["skipped, variable not found y"]);
    });

    it('test parse_query case 19: with default sort in template', async () => {
        const query_vars = {
            x: 'abc',
            y: '123',
            page_no: 1
        };
        const messages = [];
        const result = qs_core.parse_query(query_vars, {}, {x: {}, y: {}, sort: {default: ['s', 1]}}, null, null, messages);
        //console.log(JSON.stringify(result, null, 2));
        //console.log(JSON.stringify(messages, null, 2));
        expect(result).to.not.equal(null);
        expect(result).to.have.property('query');
        expect(result).to.have.property('pagination');
        expect(result.query).to.deep.equal({x: {eq: ['abc']}, y: {eq: [123]}});
        expect(result.pagination).to.deep.equal({page_no: 1, sort: {s: 1}, sort_default: true});
        expect(messages.length).equals(0);
    });

    it('test parse_query case 20: with default pagination in cfg', async () => {
        const query_vars = {
            x: 'abc',
            y: '123',
            page_no: 1
        };
        const messages = [];
        const result = qs_core.parse_query(query_vars, {pagination: {page_no: 3, page_size: 2, sort: {s: 1}}}, null, null, null, messages);
        //console.log(JSON.stringify(result, null, 2));
        //console.log(JSON.stringify(messages, null, 2));
        expect(result).to.not.equal(null);
        expect(result).to.have.property('query');
        expect(result).to.have.property('pagination');
        expect(result.query).to.deep.equal({x: {eq: ['abc']}, y: {eq: [123]}});
        expect(result.pagination).to.deep.equal({page_no: 1, page_size: 2, sort: {s: 1}, sort_default: true});
        expect(messages.length).equals(0);
    });

    it('test parse_query case 21: with sort and default sort in template', async () => {
        const query_vars = {
            x: 'abc',
            y: '123',
            page_no: 1,
            sort: 's|-1',
        };
        const messages = [];
        const result = qs_core.parse_query(query_vars, {}, {x: {}, y: {}, sort: {default: ['s', 1]}}, null, null, messages);
        //console.log(JSON.stringify(result, null, 2));
        //console.log(JSON.stringify(messages, null, 2));
        expect(result).to.not.equal(null);
        expect(result).to.have.property('query');
        expect(result).to.have.property('pagination');
        expect(result.query).to.deep.equal({x: {eq: ['abc']}, y: {eq: [123]}});
        expect(result.pagination).to.deep.equal({page_no: 1, sort: {s: -1}, sort_default: false});
        expect(messages.length).equals(0);
    });

    it('test parse_query case 22: with sort and default pagination in cfg', async () => {
        const query_vars = {
            x: 'abc',
            y: '123',
            page_no: 1,
            sort: 's|-1',
        };
        const messages = [];
        const result = qs_core.parse_query(query_vars, {pagination: {page_no: 3, page_size: 2, sort: {s: 1}}}, null, null, null, messages);
        //console.log(JSON.stringify(result, null, 2));
        //console.log(JSON.stringify(messages, null, 2));
        expect(result).to.not.equal(null);
        expect(result).to.have.property('query');
        expect(result).to.have.property('pagination');
        expect(result.query).to.deep.equal({x: {eq: ['abc']}, y: {eq: [123]}});
        expect(result.pagination).to.deep.equal({page_no: 1, page_size: 2, sort: {s: -1}, sort_default: false});
        expect(messages.length).equals(0);
    });

});