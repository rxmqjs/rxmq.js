/* global describe, it */
import should from 'should';
import Rxmq from '../index';

describe('RxMQ', () => {
    it('should register plugin', () => {
        const testPlugin = {
            testMethod() {
                return true;
            }
        };
        Rxmq.registerPlugin(testPlugin);
        should(Rxmq.testMethod()).equal(true);
    });

    it('should register channel plugin', () => {
        const testChannelPlugin = {
            testGlobalMethod() {
                return true;
            }
        };
        Rxmq.registerChannelPlugin(testChannelPlugin);
        should(Rxmq.channel('test').testGlobalMethod()).equal(true);
    });

    describe('#channel()', () => {
        const channel = Rxmq.channel('test');

        it('should return new channel', () => {
            should.exist(channel);
        });

        it('should register channel plugin', () => {
            const testPlugin = {
                testMethod() {
                    return true;
                }
            };
            channel.registerPlugin(testPlugin);
            should(channel.testMethod()).equal(true);
        });

        const testOneToMany = (done, sub, topic) => {
            let called = 0;
            const testMessage = 'test message';
            const subj = channel.subject(topic);
            const onNext = (it) => {
                should(it).equal(testMessage);
                called++;
                if (called === 2) {
                    done();
                }
            };

            sub.subscribe(onNext);
            Rxmq.subscribe({channel: 'test', topic, onNext});
            channel.onNext({topic, data: testMessage});
            // cleanup
            subj.onCompleted();
        };

        it('should create and subscribe to one-to-many subscription', (done) => {
            const topic = 'oneToMany';
            const sub = channel.observe(topic);

            testOneToMany(done, sub, topic);
        });

        it('should create and subscribe to one-to-many subscription from global object', (done) => {
            const topic = 'oneToManyGlobal';
            const sub = Rxmq.observe({channel: 'test', topic});

            testOneToMany(done, sub, topic);
        });

        it('should publish using Rxmq.onNext method', (done) => {
            const topic = 'oneToManyGlobalPublish';
            const channelName = 'test';
            const sub = Rxmq.observe({channel: channelName, topic});
            const testData = 'testGlobalPush';
            sub.subscribe((data) => {
                should(data).equal(testData);
                done();
            });

            Rxmq.onNext({channel: channelName, topic, data: testData});
        });

        it('should publish using Channel.onNext method', (done) => {
            const topic = 'oneToManyChannelPublish';
            const channelName = 'test';
            const sub = Rxmq.observe({channel: channelName, topic});
            const testData = 'testGlobalPush';
            sub.subscribe((data) => {
                should(data).equal(testData);
                done();
            });

            Rxmq.channel(channelName).onNext({topic, data: testData});
        });

        it('should publish to multiple channels', (done) => {
            const topic = 'test.one';
            const multiChannel = Rxmq.channel('multitest');
            const testData = 'testGlobalPush';
            let called = 0;
            const onData = (data) => {
                should(data).equal(testData);
                called++;
                if (called === 3) {
                    done();
                }
            };
            multiChannel.observe('test.#').subscribe(onData);
            multiChannel.observe('test.*').subscribe(onData);
            multiChannel.observe(topic).subscribe(onData);

            multiChannel.subject(topic).onNext(testData);
            multiChannel.subject(topic).onCompleted();
        });

        /*
         * Request-response tests
         */
        it('should create one-to-one subscription', (done) => {
            const topic = 'request-reply';
            const rrSub = channel.subject(topic);
            const testRequest = 'test request';
            const testReply = 'test reply';

            rrSub.subscribe(({data, replySubject}) => {
                should(data).equal(testRequest);
                replySubject.onNext(testReply);
                replySubject.onCompleted();
            });
            channel.request({topic, data: testRequest})
                .subscribe((replyData) => {
                    should(replyData).equal(testReply);
                    done();
                });
        });

        it('should create one-to-one subscription with topic name as first param', (done) => {
            const topic = 'request-reply';
            const rrSub = channel.subject(topic);
            const testRequest = 'test request';
            const testReply = 'test reply';

            rrSub.subscribe(({data, replySubject}) => {
                should(data).equal(testRequest);
                replySubject.onNext(testReply);
                replySubject.onCompleted();
            });
            channel.request(topic, {data: testRequest})
                .subscribe((replyData) => {
                    should(replyData).equal(testReply);
                    done();
                });
        });
    });
});

// load other test suites
require('./utils');
