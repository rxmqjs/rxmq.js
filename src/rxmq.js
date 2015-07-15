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
