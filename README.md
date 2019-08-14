# Rxmq.js

[![Build Status](https://travis-ci.com/rxmqjs/rxmq.js.svg?branch=master)](https://travis-ci.com/rxmqjs/rxmq.js)
[![npm](https://img.shields.io/npm/v/rxmq.svg)](https://www.npmjs.com/package/rxmq)
[![MIT](https://img.shields.io/npm/l/rxmq.svg)](http://opensource.org/licenses/MIT)

> JavaScript pub/sub library based on RxJS

## What is it?

Rxmq.js is an in-memory message bus based on [reactive extensions](https://github.com/Reactive-Extensions/RxJS) - inspired by [postal.js](https://github.com/postaljs/postal.js) - written in JavaScript using ES6 and Babel.
Rxmq.js runs equally good in the browser and on the server using node.js.
It provides a 'broker' that allows for creation of more sophisticated pub/sub implementations than what you usually find in event-style based libraries.
On top of that, all used objects are parts of reactive extensions which allows doing a lot of cool things with them out of the box.

## Quick start

If you want to subscribe to an observable, you tell Rxmq what channel and topic to subscribe to and a set of functions to be invoked (taken from [Rx.Observable.subscribe](https://github.com/Reactive-Extensions/RxJS/blob/master/doc/api/core/operators/subscribe.md)):

```js
import Rxmq from 'rxmq';

const subscription = Rxmq.channel('posts')
  .observe('post.add')
  .subscribe(
    // following methods are same as for Rx.Observable.subscribe
    data => {
      // handle new data ...
    },
    error => {
      // handle error ...
    }
  );
```

The publisher might do something similar to this:

```js
Rxmq.channel('posts')
  .subject('post.add')
  .next({
    title: 'Woo-hoo, first post!',
    text: 'My lengthy post here',
  });
```

Note, that if you are not using ES6 modules (e.g. with babel), you will need to require Rxmq in the following way:

```js
var Rxmq = require('rxmq').default;
```

### Channels? Topics?

A channel is a logical partition of topics, more specifically - a set of topics.
As well explained by [postal.js readme section on channels](https://github.com/postaljs/postal.js/blob/master/README.md), conceptually, it's like a dedicated highway for a specific set of communication.
In case of Rxmq.js each topic is represented by a slightly tweaked [Rx.Subject](https://github.com/Reactive-Extensions/RxJS/blob/master/doc/api/subjects/subject.md) (specifically - it never triggers `complete()`, so you can keep sending your data all the time).
Using channel- and topic-oriented messaging instead of traditional JavaScript approaches like callbacks or promises enables you to separate components (or modules) communication by context.

It's possible to get a more concise API if you want to hang onto a `Channel` - which can be really convenient while working with a specific channel (e.g. inside of a specific component):

```js
const channel = Rxmq.channel('posts');
const subject = channel.subject('post.add');

const subscription = subject.subscribe(data => {
  /*do stuff with data */
});

subject.next({
  title: 'Woo-hoo, first post!',
  text: 'My lengthy post here',
});
```

## How's Rxmq.js Different From {Insert Eventing Library Here}?

Some of those are shamelessly taken from postal.js list :)

- Rxmq is not an event emitter - it's not meant to be mixed into an instance. Instead, it's a stand alone 'broker' – a _message bus_.
- Rxmq uses a slightly modified _Rx.Subject_ (it will never be completed or stopped by error) to pass messages. This means you use all the cool features of [Rx.Observable](https://github.com/Reactive-Extensions/RxJS/blob/master/doc/api/core/observable.md) and [Rx.Observer](https://github.com/Reactive-Extensions/RxJS/blob/master/doc/api/core/observer.md) while working on your messaging.
- Most 'event aggregator' libs are _single channel_ - which can lead to event name collision, and reduce the performance of matching an event to the correct subscribers. Rxmq is _multi-channel_.
- Rxmq built-in topic logic supports hierarchical wildcard topic bindings - supporting the same logic as topic bindings in the AMQP spec. And if you don't like that approach, you can easily provide your own bindings resolver.

## More on How to Use It

Here are four examples of using Rxmq.

```js
// This gets you a handle to the default Rxmq channel
// You can get a named channel instead like this:
// const channel = Rxmq.channel('DoctorWho');
const channel = Rxmq.channel();

// subscribe to 'name.change' topics
const subscription = channel.observe('name.change').subscribe(data => {
  $('#example1').html('Name: ' + data.name);
});

// And someone publishes a name change:
channel.subject('name.change').next({ name: 'Dr. Who' });

// To dispose, just trigger the unsubscribe() method:
subscription.unsubscribe();
```

### Subscribing to a wildcard topic using \*

The `*` symbol represents 'one word' in a topic (i.e - the text between two periods of a topic).
By subscribing to `'*.changed'`, the binding will match `name.changed` & `location.changed` but _not_ `changed.companion`.

```js
const chgSubscription = channel.observe('*.changed').subscribe(data => {
  $('<li>' + data.type + ' changed: ' + data.value + '</li>').appendTo(
    '#example2'
  );
});
channel.subject('name.changed').next({ type: 'Name', value: 'John Smith' });
channel
  .subject('location.changed')
  .next({ type: 'Location', value: 'Early 20th Century England' });
chgSubscription.unsubscribe();
```

### Subscribing to a wildcard topic using &#35;

The `#` symbol represents 0-n number of characters/words in a topic string. By subscribing to `'DrWho.#.Changed'`, the binding will match `DrWho.NinthDoctor.Companion.Changed` & `DrWho.Location.Changed` but _not_ `Changed`.

```javascript
const starSubscription = channel.observe('DrWho.#.Changed').subscribe(data => {
  $('<li>' + data.type + ' Changed: ' + data.value + '</li>').appendTo(
    '#example3'
  );
});
channel
  .subject('DrWho.NinthDoctor.Companion.Changed')
  .next({ type: 'Companion Name', value: 'Rose' });
channel
  .subject('DrWho.TenthDoctor.Companion.Changed')
  .next({ type: 'Companion Name', value: 'Martha' });
channel
  .subject('DrWho.Eleventh.Companion.Changed')
  .next({ type: 'Companion Name', value: 'Amy' });
channel
  .subject('DrWho.Location.Changed')
  .next({ type: 'Location', value: 'The Library' });
channel
  .subject('TheMaster.DrumBeat.Changed')
  .next({ type: 'DrumBeat', value: "This won't trigger any subscriptions" });
channel.subject('Changed').next({
  type: 'Useless',
  value: "This won't trigger any subscriptions either",
});
starSubscription.unsubscribe();
```

### Using Rx.Observable methods with a subscription

```js
const dupChannel = Rxmq.channel('Blink');
const dupSubscription = dupChannel
  .observe('WeepingAngel.#')
  .distinctUntilChanged()
  .subscribe(data => {
    $('<li>' + data.value + '</li>').appendTo('#example4');
  });
// demonstrating multiple channels per topic being used
// You can do it this way if you like, but the example above has nicer syntax (and *much* less overhead)
dupChannel.subject('WeepingAngel.DontBlink').next({ value: "Don't Blink" });
dupChannel.subject('WeepingAngel.DontBlink').next({ value: "Don't Blink" });
dupChannel
  .subject('WeepingAngel.DontEvenBlink')
  .next({ value: "Don't Even Blink" });
dupChannel
  .subject('WeepingAngel.DontBlink')
  .next({ value: "Don't Close Your Eyes" });
dupChannel.subject('WeepingAngel.DontBlink').next({ value: "Don't Blink" });
dupChannel.subject('WeepingAngel.DontBlink').next({ value: "Don't Blink" });
dupSubscription.unsubscribe();
```

### Using request-response pattern

To make a request, you can do the following:

```js
const channel = rxmq.channel('user');

channel
  .request({ topic: 'last.login', data: { userId: 8675309 } })
  .timeout(2000)
  .subscribe(
    data =>
      console.log(
        `Last login for userId: ${data.userId} occurred on ${data.time}`
      ),
    err => console.error('Uh oh! Error:', err),
    () => console.log('done!')
  );
```

It's also possible to make a request with custom reply subject, like so:

```js
const channel = rxmq.channel('user');

channel
  .request({
    topic: 'posts.all',
    data: { userId: 8675309 },
    Subject: Rx.Subject,
  })
  .subscribe(
    post => console.log(`Got post: ${post.id}`),
    err => console.error('Uh oh! Error:', err),
    () => console.log('done!')
  );
```

To handle requests:

```js
// SUCCESS REPLY
const subscription = channel
  .observe('last.login')
  .subscribe(({ data, replySubject }) => {
    const result = getLoginInfo(data.userId);
    // `replySubject` is just a Rx.AsyncSubject
    replySubject.next({ time: result.time, userId: data.userId });
    replySubject.complete();
  });

// ERROR REPLY
const subscription = channel
  .observe('last.login')
  .subscribe(({ data, replySubject }) => {
    const result = getLoginInfo(data.userId);
    // `replySubject` is just a Rx.AsyncSubject
    replySubject.error(new Error('No such user'));
    replySubject.complete();
  });
```

Make sure to _always_ call `.complete()` after you're done with dispatching your data.

### Connecting external Rx.Observable to Rxmq topic

```js
const topic = channel.subject('ajax');
const ajax = Rx.Observable.fromPromise($.ajax({ url: 'http://...' }).promise());
ajax.multicast(topic).connect();
```

## Available plugins

- [rxmq.aliases](https://github.com/rxmqjs/rxmq.aliases) - a plugin that provides bus- and channel-level convenience aliases.
- [rxmq.middleware](https://github.com/rxmqjs/rxmq.middleware) - a plugin that adds support for topic-based middleware.

## I still need help!

Feel free to ask any questions you might have by [opening an issue](https://github.com/rxmqjs/rxmq.js/issues).

## Build, Dependencies, etc.

- Rxmq depends only on [RxJS](https://github.com/Reactive-Extensions/RxJS).

## Can I contribute?

Sure thing!
While project is still in its early days, I hope the API is relatively stable.
Pull requests are welcome, but please make sure to include tests for your additions.

## License

[MIT](http://www.opensource.org/licenses/mit-license)
