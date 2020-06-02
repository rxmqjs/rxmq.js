import test from 'tape';
import { Subject } from 'rxjs';
import Rxmq from '../';

test('RxMQ', it => {
  it.test('# should register plugin', t => {
    const testPlugin = {
      testMethod() {
        return true;
      },
    };
    Rxmq.registerPlugin(testPlugin);
    t.equal(Rxmq.testMethod(), true);
    t.end();
  });

  it.test('# should register channel plugin', t => {
    const testChannelPlugin = {
      testGlobalMethod() {
        return true;
      },
    };
    Rxmq.registerChannelPlugin(testChannelPlugin);
    t.equal(Rxmq.channel('test').testGlobalMethod(), true);
    t.end();
  });

  it.test('# should create new channel', t => {
    const channel = Rxmq.channel('test');
    t.assert(channel);
    t.end();
  });

  it.test('> channel()', subit => {
    subit.test('# should register channel plugin', t => {
      const channel = Rxmq.channel('test');
      const testPlugin = {
        testMethod() {
          return true;
        },
      };
      channel.registerPlugin(testPlugin);
      t.equal(channel.testMethod(), true);
      t.end();
    });

    subit.test('# should create new subject with custom Subject', t => {
      const channel = Rxmq.channel('customSubject');
      const subj = channel.subject('test', { Subject: Subject });
      t.plan(2);
      subj.subscribe(
        ok => {
          console.log('done:', ok);
          t.ok(ok);
        },
        e => {
          throw e;
        }
      );
      subj.next(true);
      subj.next(true);
      subj.complete();
    });

    subit.test(
      '# should create and subscribe to one-to-many subscription',
      t => {
        const channel = Rxmq.channel('test');
        const subj = channel.subject('oneToMany');

        // test data
        const testMessage = 'test message';
        // subscribe
        const sub = subj.subscribe(item => {
          sub.unsubscribe();
          t.equal(item, testMessage);
          t.end();
        });
        subj.next(testMessage);
      }
    );

    subit.test('# should publish to multiple channels', t => {
      const multiChannel = Rxmq.channel('multitest');
      const testData = 'testGlobalPush';
      t.plan(3);
      const onData = data => {
        t.equal(data, testData);
      };
      multiChannel.observe('test.#').subscribe(onData);
      multiChannel.observe('test.*').subscribe(onData);
      multiChannel.observe('test.one').subscribe(onData);
      // send
      multiChannel.subject('test.one').next(testData);
    });

    subit.test('# should publish to multiple channels', t => {
      const resubChan = Rxmq.channel('resubtest');
      const testData = ['test', 'test2'];
      t.plan(2);
      // generate first sub
      const sub = resubChan.observe('test.#').subscribe(data => {
        t.equal(data, testData[0]);
        sub.unsubscribe();

        // listen for second output
        resubChan.observe('test.#').subscribe(data2 => {
          t.equal(data2, testData[1]);
        });

        // trigger second output
        resubChan.subject('test.one').next(testData[1]);
      });
      // send
      resubChan.subject('test.one').next(testData[0]);
    });

    subit.test(
      'should not republish the same message multiple times on unsubscribing to a topic and resubscribing',
      t => {
        const chan = Rxmq.channel('unsub-then-new-sub');
        const testData1 = 'test-data-1';

        const observedEventsFirstSub = [];
        // generate first sub
        const sub = chan
          .observe('test.#')
          .subscribe(data => observedEventsFirstSub.push(data));

        // publish, which should be consumed by sub
        chan.subject('test.one').next(testData1);

        t.deepLooseEqual(observedEventsFirstSub, [testData1]);

        sub.unsubscribe();

        const observedEventsSecondSub = [];
        chan
          .observe('test.#')
          .subscribe(data => observedEventsSecondSub.push(data));

        const testData2 = 'test-data-2';
        chan.subject('test.one').next(testData2);

        t.deepLooseEqual(observedEventsSecondSub, [testData2]);
        t.end();
      }
    );

    // Test for #25
    subit.test('wildcard and non wildcard consumers should get events', t => {
      const channel = Rxmq.channel('wildcard-and-non-wildcard');

      const e1 = { value: 1 };
      const e2 = { value: 2 };

      const observedEventsObs1 = [];
      const observedEventsObs2 = [];
      const observedEventsObs3 = [];
      const observedEventsPatternObs1 = [];
      const observedEventsPatternObs2 = [];
      const observedEventsPatternObs3 = [];

      channel
        .observe('topic.publish')
        .subscribe(e => observedEventsObs1.push(e));
      channel
        .observe('topic.publish')
        .subscribe(e => observedEventsObs2.push(e));
      channel
        .observe('topic.publish')
        .subscribe(e => observedEventsObs3.push(e));
      channel
        .observe('topic.*')
        .subscribe(e => observedEventsPatternObs1.push(e));
      channel
        .observe('topic.*')
        .subscribe(e => observedEventsPatternObs2.push(e));
      channel
        .observe('topic.*')
        .subscribe(e => observedEventsPatternObs3.push(e));

      channel.subject('topic.publish').next(e1);
      channel.subject('topic.publish').next(e2);

      const inputEvents = [e1, e2];
      t.deepLooseEqual(observedEventsObs1, inputEvents);
      t.deepLooseEqual(observedEventsObs2, inputEvents);
      t.deepLooseEqual(observedEventsObs3, inputEvents);
      t.deepLooseEqual(observedEventsPatternObs1, inputEvents);
      t.deepLooseEqual(observedEventsPatternObs2, inputEvents);
      t.deepLooseEqual(observedEventsPatternObs3, inputEvents);

      t.end();
    });

    subit.test('# should allow dispatching several errors', t => {
      t.plan(4);
      const subject = Rxmq.channel('mutlierror').subject('test');
      subject.subscribe(val => t.ok(val), e => t.assert(e));
      subject.error(new Error('test'));
      subject.error(new Error('test 2'));
      subject.error(new Error('test 3'));
      subject.next(true);
    });

    /*
     * Request-response tests
     */
    subit.test('# should create one-to-one subscription', t => {
      const topic = 'request-reply';
      const channel = Rxmq.channel('request');
      const rrSub = channel.subject(topic);
      const testRequest = 'test request';
      const testReply = 'test reply';

      rrSub.subscribe(({ data, replySubject }) => {
        t.equal(data, testRequest);
        replySubject.next(testReply);
        replySubject.complete();
      });
      channel.request({ topic, data: testRequest }).subscribe(replyData => {
        t.equal(replyData, testReply);
        t.end();
      });
    });

    subit.test(
      '# should create one-to-one subscription with custom reply subject',
      t => {
        const topic = 'custom-request-reply';
        const channel = Rxmq.channel('request');
        const rrSub = channel.subject(topic);
        const testRequest = 'test request';
        const testReply = ['test reply', 'test reply 2', 'test reply 3'];

        rrSub.subscribe(({ replySubject }) => {
          testReply.map(item => replySubject.next(item));
          replySubject.complete();
        });
        // test reply
        const fullReply = [];
        channel
          .request({ topic, data: testRequest, Subject: Subject })
          .subscribe(
            replyData => {
              fullReply.push(replyData);
            },
            e => {
              throw e;
            },
            () => {
              fullReply.map((item, i) => t.equal(testReply[i], item));
              t.end();
            }
          );
      }
    );
  });
});
