/* global describe, it */
import should from 'should';
import {compareTopics} from '../src/utils';

describe('Utils', () => {
    describe('#Topic Comparator', () => {
        it('should correctly compare topics', () => {
            should(compareTopics('test', 'test')).equal(true);
            should(compareTopics('test.one', 'test.#')).equal(true);
            should(compareTopics('test.one.two', 'test.#')).equal(true);
            should(compareTopics('test.one.two', 'test.#.two')).equal(true);
            should(compareTopics('test.one', 'test.*')).equal(true);
            should(compareTopics('test.two', 'test.#.two')).equal(true);
            should(compareTopics('test.one.two', 'test.*')).equal(true);
            should(compareTopics('test.one.two', '*.one')).equal(true);
            should(compareTopics('test.one.two', '*')).equal(true);
            should(compareTopics('test.one.two', '#')).equal(true);
        });

        it('should correctly fail topics', () => {
            should(compareTopics('test.one', 'test')).equal(false);
            should(compareTopics('test.one', 'test.#.two')).equal(false);
            should(compareTopics('test.two', 'test.*.two')).equal(false);
            should(compareTopics('test.one.two', '*.two')).equal(false);
        });
    });
});
