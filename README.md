# Rxmq.js

[![Join the chat at https://gitter.im/rxmqjs/rxmq.js](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/rxmqjs/rxmq.js?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![wercker status](https://app.wercker.com/status/56f1fdd3a0180730a13447755e5714df/s "wercker status")](https://app.wercker.com/project/bykey/56f1fdd3a0180730a13447755e5714df)
[![npm](https://img.shields.io/npm/v/rxmq.svg)](https://www.npmjs.com/package/rxmq)
[![MIT](https://img.shields.io/npm/l/rxmq.svg)](http://opensource.org/licenses/MIT)

> JavaScript pub/sub library based on RxJS

## What is it?

Rxmq.js is an in-memory message bus based on [reactive extensions](https://github.com/Reactive-Extensions/RxJS) - inspired by [postal.js](https://github.com/postaljs/postal.js) - written in JavaScript using ES6 and Babel.
Rxmq.js runs equally good in the browser and on the server using node.js or io.js.
It provides a 'broker' that allows for creation of more sophisticated pub/sub implementations than what you usually find in event-style based libraries.
On top of that, all used objects are parts of reactive extensions which allows doing a lot of cool things with them out of the box.

## Quick start

If you want to subscribe to an observable, you tell Rxmq what channel and topic to subscribe to and a set of functions to be invoked (taken from [Rx.Observable.subscribe](https://github.com/Reactive-Extensions/RxJS/blob/master/doc/api/core/operators/subscribe.md)):

```js
    const subscription = Rxmq.subscribe({
        channel: 'posts',
        topic: 'post.add',
        // following methods are same as for Rx.Observable.subscribe
        onNext(data) {
            // handle new data ...
        },
        onError(error) {
            // handle error ...
        }
    });
```

The publisher might do something similar to this:

```js
    Rxmq.onNext({
        channel: 'posts',
        topic: 'post.add',
        data: {
            title: 'Woo-hoo, first post!',
            text: 'My lengthy post here'
        }
    });
```

### Channels? Topics?

A channel is a logical partition of topics, more specifically - a set of topics.
As well explained by [postal.js readme section on channels](https://github.com/postaljs/postal.js/blob/master/README.md), conceptually, it's like a dedicated highway for a specific set of communication.
In case of Rxmq.js each topic is represented by a slightly tweaked [Rx.Subject](https://github.com/Reactive-Extensions/RxJS/blob/master/doc/api/subjects/subject.md) (specifically - it never triggers `onCompleted()`, so you can keep sending your data all the time).
Using channel- and topic-oriented messaging instead of traditional JavaScript approaches like callbacks or promises enables you to separate components (or modules) communication by context.

Same as for `Rxmq.js`, it's possible to get a more concise API if you want to hang onto a `Channel` instance - which can be really convenient while working with a specific channel (e.g. inside of a specific component):

```js
    const channel = Rxmq.channel('posts');

    const subscription = channel.subscribe({
        topic: 'post.add',
        onNext(data) {
            /*do stuff with data */
        }
    });

    channel.onNext({
        topic: 'post.add',
        data: {
            title: 'Woo-hoo, first post!',
            text: 'My lengthy post here'
        }
    });
```

You can also go even deeper and get a specific instance for topics, like so:

```js
    const channel = Rxmq.channel('posts');
    const topic = channel.subject('post.add');

    const subscription = channel.observe('post.add')
        .subscribe(onNext(data) {
            /*do stuff with data */
        });

    topic.onNext({
        title: 'Woo-hoo, first post!',
        text: 'My lengthy post here'
    });
```

## How's Rxmq.js Different From {Insert Eventing Library Here}?

Some of those are shamelessly taken from postal.js list :)

* Rxmq is not an event emitter - it's not meant to be mixed into an instance. Instead, it's a stand alone 'broker' – a *message bus*.
* Rxmq uses a slightly modified *Rx.Subject* to pass messages. This means you use all the cool features of [Rx.Observable](https://github.com/Reactive-Extensions/RxJS/blob/master/doc/api/core/observable.md) and [Rx.Observer](https://github.com/Reactive-Extensions/RxJS/blob/master/doc/api/core/observer.md) while working on your messaging.
* Most 'event aggregator' libs are *single channel* - which can lead to event name collision, and reduce the performance of matching an event to the correct subscribers. Rxmq is *multi-channel*.
* Rxmq built-in topic logic supports hierarchical wildcard topic bindings - supporting the same logic as topic bindings in the AMQP spec. And if you don't like that approach, you can easily provide your own bindings resolver.

## More on How to Use It

Here are four examples of using Rxmq.

```js
// This gets you a handle to the default Rxmq channel
// You can get a named channel instead like this:
// const channel = Rxmq.channel('DoctorWho');
const channel = Rxmq.channel();

// subscribe to 'name.change' topics
const subscription = channel.subscribe({
    topic: 'name.change',
    onNext(data) {
        $('#example1').html('Name: ' + data.name);
    }
});

// And someone publishes a name change:
channel.onNext({topic: 'name.change', data: {name: 'Dr. Who'});

// To dispose, just trigger the dispose() method:
subscription.dispose();

// Rxmq also provides a top-level ability to subscribe/publish
// used primarily when you don't need to hang onto a channel instance:
const anotherSub = Rxmq.subscribe({
    channel: 'MyChannel',
    topic: 'name.change',
    onNext(data) {
        $('#example1').html('Name: ' + data.name);
    }
});

Rxmq.onNext({
    channel: 'MyChannel',
    topic: 'name.change',
    data: {
        name: 'Dr. Who'
    }
});
```

### Subscribing to a wildcard topic using *

The `*` symbol represents 'one word' in a topic (i.e - the text between two periods of a topic).
By subscribing to `'*.changed'`, the binding will match `name.changed` & `location.changed` but *not* `changed.companion`.

```js
const chgSubscription = channel.subscribe({
    topic: '*.changed',
    onNext(data) {
        $('<li>' + data.type + ' changed: ' + data.value + '</li>').appendTo('#example2');
    }
});
channel.onNext({topic: 'name.changed', data: {type: 'Name', value: 'John Smith'}});
channel.onNext({topic: 'location.changed', data: {type: 'Location', value: 'Early 20th Century England'}});
chgSubscription.dispose();
```

### Subscribing to a wildcard topic using &#35;

The `#` symbol represents 0-n number of characters/words in a topic string. By subscribing to `'DrWho.#.Changed'`, the binding will match `DrWho.NinthDoctor.Companion.Changed` & `DrWho.Location.Changed` but *not* `Changed`.

```javascript
const starSubscription = channel.subscribe({
    topic: 'DrWho.#.Changed',
    onNext(data) {
        $('<li>' + data.type + ' Changed: ' + data.value + '</li>').appendTo('#example3');
    }
});
channel.onNext({topic: 'DrWho.NinthDoctor.Companion.Changed', data: {type: 'Companion Name', value: 'Rose'}});
channel.onNext({topic: 'DrWho.TenthDoctor.Companion.Changed', data: {type: 'Companion Name', value: 'Martha'}});
channel.onNext({topic: 'DrWho.Eleventh.Companion.Changed', data: {type: 'Companion Name', value: 'Amy'}});
channel.onNext({topic: 'DrWho.Location.Changed', data: {type: 'Location', value: 'The Library'}});
channel.onNext({topic: 'TheMaster.DrumBeat.Changed', data: {type: 'DrumBeat', value: 'This won\'t trigger any subscriptions'}});
channel.onNext({topic: 'Changed', data: {type: 'Useless', value: 'This won\'t trigger any subscriptions either'}});
starSubscription.dispose();
```


### Using Rx.Observable methods with a subscription

```js
const dupChannel = Rxmq.channel('Blink');
const dupSubscription = dupChannel.observe('WeepingAngel.#')
    .distinctUntilChanged()
    .subscribe((data) => {
        $('<li>' + data.value + '</li>').appendTo('#example4');
    });
// demonstrating multiple channels per topic being used
// You can do it this way if you like, but the example above has nicer syntax (and *much* less overhead)
dupChannel.onNext({topic: 'WeepingAngel.DontBlink', data: {value: 'Don\'t Blink'}});
dupChannel.onNext({topic: 'WeepingAngel.DontBlink', data: {value: 'Don\'t Blink'}});
dupChannel.onNext({topic: 'WeepingAngel.DontEvenBlink', data: {value: 'Don\'t Even Blink'}});
dupChannel.onNext({topic: 'WeepingAngel.DontBlink', data: {value: 'Don\'t Close Your Eyes'}});
dupChannel.onNext({topic: 'WeepingAngel.DontBlink', data: {value: 'Don\'t Blink'}});
dupChannel.onNext({topic: 'WeepingAngel.DontBlink', data: {value: 'Don\'t Blink'}});
dupSubscription.dispose();
```

### Using request-response pattern

To make a request, you can do the following:
```js
const channel = rxmq.channel('user');

channel.request({topic: "last.login", {data: { userId: 8675309 }})
    .timeout(2000)
    .subscribe(
    (data) => console.log(`Last login for userId: ${data.userId} occurred on ${data.time}`),
    (err) => console.error('Uh oh! Error:', err),
    () => console.log('done!')
);
```

To handle requests:
```js
// SUCCESS REPLY
const subscription = channel.subscribe('last.login', ({data, replySubject}) => {
    const result = getLoginInfo(data.userId);
    // `replySubject` is just a Rx.AsyncSubject
    replySubject.onNext({time: result.time, userId: data.userId});
    replySubject.onCompleted();
});

// ERROR REPLY
const subscription = channel.subscribe('last.login', ({data, replySubject}) => {
    const result = getLoginInfo(data.userId);
    // `replySubject` is just a Rx.AsyncSubject
    replySubject.onError(new Error('No such user'));
    replySubject.onCompleted();
});
```

Make sure to *always* call `.onCompleted()` after you're done with dispatching your data.

### Connecting external Rx.Observable to Rxmq topic

```js
const topic = channel.subject('ajax');
const ajax = Rx.Observable.fromPromise($.ajax({url: 'http://...'}).promise());
topic.multicast(ajax).connect();
```

## More References

Please visit the [rxmq.js documentation](http://rxmqjs.github.io/rxmq.js/) website for full API documentation.

## I still need help!

Feel free to ask any questions you might have on [our gitter channel](https://gitter.im/rxmqjs/rxmq.js).
Some of the developers and contributors are there most of the time.
If you have any RxJS related questions, I'd recommend asking on [RxJS gitter channel](https://gitter.im/Reactive-Extensions/RxJS), it's pretty great!

## Build, Dependencies, etc.

* Rxmq depends only on [RxJS](https://github.com/Reactive-Extensions/RxJS), and since Rxmq really just uses `Rx.Subject` and `Rx.Observable.observe` methods, using [rx.lite](https://github.com/Reactive-Extensions/RxJS/blob/master/doc/libraries/lite/rx.lite.md) is sufficient.
* Rxmq uses [turris-gulp-tasks](https://github.com/turrisjs/turris-gulp-tasks) for building, running tests and examples.
	* To build
        * run `npm install` to install all deps
        * run `npm run build` - then check the `es5/` folder for the output
    * To run tests & examples
        * Tests are node-based: `npm test`

## Can I contribute?

Sure thing!
While project is still in its early days, I hope the API is relatively stable.
Pull requests are welcome, but please make sure to include tests for your additions.

## License

[MIT](http://www.opensource.org/licenses/mit-license)
