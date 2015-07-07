import Channel from './channel';

/**
 * Rxmq message bus class
 */
class Rxmq {
    /**
    * Represents a new Rxmq message bus.
    * Normally you'd just use a signleton returned by default, but it's also
    * possible to create a new instance of Rxmq should you need it.
    * @constructor
    * @example
    * import {Rxmq} from 'rxmq';
    * const myRxmq = new Rxmq();
    */
    constructor() {
        /**
         * Holds channels definitions
         * @type {Object}
         * @private
         */
        this.channels = {};
        /**
         * Holds channel plugins definitions
         * @type {Object}
         * @private
         */
        this.channelPlugins = [];
    }

    /**
     * Returns a channel for given name
     * @param  {String} name  Channel name
     * @return {Channel}      Channel object
     * @example
     * const testChannel = rxmq.channel('test');
     */
    channel(name = 'defaultRxmqChannel') {
        if (!this.channels[name]) {
            this.channels[name] = new Channel(this.channelPlugins);
        }

        return this.channels[name];
    }

    /**
     * Get an Rx.Observable for specific set of topics on a given channel
     * @param  {Object} options             Observe options
     * @param  {String} options.channel     Channel name
     * @param  {String} options.topic       Topic name
     * @return {Rx.Observable}              Rx.Observable for given set of topics
     * @example
     * rxmq.observe({
     *     channel: 'test',
     *     topic: 'test.topic',
     * }).subscribe((res) => { // default Rx.Observable subscription
     *    // handle response here
     *    // ...
     * });
     */
    observe({channel, topic}) {
        return this.channel(channel).observe(topic);
    }

    /**
     * Subscribe to specific topic and channel using given handler functions
     * @param  {Object}        options                  Subscription options
     * @param  {String}        options.channel          Channel name
     * @param  {String}        options.topic            Topic name
     * @param  {Function}      options.onNext           Function handler for Rx.Observable onNext
     * @param  {Function}      options.onError          Function handler for Rx.Observable onError
     * @param  {Function}      options.onCompleted      Function handler for Rx.Observable onCompleted
     * @return {Rx.Disposable}                          Disposable subscription
     * @example
     * // init subscription
     * const subscription = rxmq.subscribe({
     *     channel: 'test',
     *     topic: 'test.topic',
     *     onNext: (data) => {
     *         // your code here
     *     },
     *     onError: console.error,
     *     onCompleted: () => console.log('done!'),
     * });
     * // do work
     * // ...
     * // cleanup if needed
     * subscription.dispose();
     */
    subscribe({channel, topic, onNext, onError, onCompleted}) {
        return this.channel(channel).observe(topic).subscribe(onNext, onError, onCompleted);
    }

    /**
     * Trigger `.onNext()` for specific topic on specific channel
     * @param  {Object} options          Triggering options
     * @param  {String} options.channel  Channel name
     * @param  {String} options.topic    Topic name
     * @param  {Any}    options.data     Data to send
     * @return {void}
     * @example
     * rxmq.onNext({
     *     channel: 'test',
     *     topic: 'test.topic',
     *     data: 'any data here',
     * });
     */
    onNext({channel, topic, data}) {
        this.channel(channel).subject(topic).onNext(data);
    }

    /**
     * Register new Rxmq plugin
     * @param  {Object} plugin      Plugin object
     * @return {void}
     * @example
     * import myPlugin from 'my-plugin';
     * rxmq.registerPlugin(myPlugin);
     */
    registerPlugin(plugin) {
        for (const prop in plugin) {
            if (!this.hasOwnProperty(prop)) {
                /**
                 * Hide from esdoc
                 * @private
                 */
                this[prop] = plugin[prop];
            }
        }
    }

    /**
     * Register new Channel plugin
     * @param  {Object} plugin      Channel plugin object
     * @return {void}
     * @example
     * import myChannelPlugin from 'my-channel-plugin';
     * rxmq.registerChannelPlugin(myChannelPlugin);
     */
    registerChannelPlugin(plugin) {
        this.channelPlugins.push(plugin);
        for (const name in this.channels) {
            this.channels[name].registerPlugin(plugin);
        }
    }
}

/**
 * Rxmq bus definition
 */
export default Rxmq;
