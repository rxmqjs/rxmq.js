import test from 'tape';
import {compareTopics} from '../src/utils';

test('Utils', (describe) => {
    describe.test('> Topic Comparator', (it) => {
        it.test('# should correctly compare topics', (t) => {
            t.equal(compareTopics('test', 'test'), true);
            t.equal(compareTopics('test.one', 'test.#'), true);
            t.equal(compareTopics('test.one.two', 'test.#'), true);
            t.equal(compareTopics('test.one.two', 'test.#.two'), true);
            t.equal(compareTopics('test.one', 'test.*'), true);
            t.equal(compareTopics('test.two', 'test.#.two'), true);
            t.equal(compareTopics('test.one.two', 'test.*'), true);
            t.equal(compareTopics('test.one.two', '*.one'), true);
            t.equal(compareTopics('test.one.two', '*'), true);
            t.equal(compareTopics('test.one.two', '#'), true);
            t.end();
        });

        it.test('# should correctly fail topics', (t) => {
            t.equal(compareTopics('test.one', 'test'), false);
            t.equal(compareTopics('test.one', 'test.#.two'), false);
            t.equal(compareTopics('test.two', 'test.*.two'), false);
            t.equal(compareTopics('test.one.two', '*.two'), false);
            t.end();
        });
    });
});
