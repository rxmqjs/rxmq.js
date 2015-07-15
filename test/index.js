/* global describe, it */
import should from 'should';
import Rx from 'rx';
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

    it('should create new channel', () => {
        const channel = Rxmq.channel('test');
        should.exist(channel);
    });

    describe('#channel()', () => {
        it('should register channel plugin', () => {
            const channel = Rxmq.channel('test');
            const testPlugin = {
                testMethod() {
                    return true;
                }
            };
            channel.registerPlugin(testPlugin);
            should(channel.testMethod()).equal(true);
        });

        it('should create new subject with custom Rx.Subject', (done) => {
            const channel = Rxmq.channel('customSubject');
            const subj = channel.subject('test', {Subject: Rx.Subject});
            let called = 0;
            subj.subscribe(
                () => {
                    called++;
                },
                (e) => { throw e; },
                () => {
                    should(called).equal(2);
                    done();
                }
            );
            subj.onNext(1);
            subj.onNext(2);
            subj.onCompleted();
        });

        it('should create and subscribe to one-to-many subscription', (done) => {
            const channel = Rxmq.channel('test');
            const subj = channel.subject('oneToMany');

            // test data
            const testMessage = 'test message';
            // subscribe
            const sub = subj.subscribe((it) => {
                should(it).equal(testMessage);
                sub.dispose();
                done();
            });
            subj.onNext(testMessage);
        });

        it('should publish to multiple channels', (done) => {
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
            multiChannel.observe('test.one').subscribe(onData);
            // send
            multiChannel.subject('test.one').onNext(testData);
        });

        /*
         * Request-response tests
         */
        it('should create one-to-one subscription', (done) => {
            const topic = 'request-reply';
            const channel = Rxmq.channel('request');
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

        it('should create one-to-one subscription with custom reply subject', (done) => {
            const topic = 'custom-request-reply';
            const channel = Rxmq.channel('request');
            const rrSub = channel.subject(topic);
            const testRequest = 'test request';
            const testReply = ['test reply', 'test reply 2', 'test reply 3'];

            rrSub.subscribe(({replySubject}) => {
                testReply.map((it) => replySubject.onNext(it));
                replySubject.onCompleted();
            });
            // test reply
            const fullReply = [];
            channel.request({topic, data: testRequest, Subject: Rx.Subject})
                .subscribe(
                    (replyData) => {
                        fullReply.push(replyData);
                    },
                    (e) => {
                        throw e;
                    },
                    () => {
                        fullReply.map((it, i) => should(testReply[i]).equal(it));
                        done();
                    }
                );
        });
    });
});

// load other test suites
require('./utils');
