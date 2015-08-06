import Rx from 'rx';

/**
 * Middleware manager class.
 * Provides a convenient way to manage middleware functions
 */
class Middleware {
    /**
     * Middleware manager constructor.
     * Instantiates basic internal variables
     * @return {Middleware}     New instance of Middleware mananger
     */
    constructor() {
        /**
         * Array of all middleware objects
         * @private
         * @type {Array}
         */
        this.middleware = [];
        /**
         * Array of deleted middleware names
         * @private
         * @type {Array}
         */
        this.deletedMiddleware = [];
        /**
         * ReplaySubject containing all middlewares
         * @private
         * @type {Rx.ReplaySubject}
         */
        this.middlewareStream = new Rx.ReplaySubject();
    }

    /**
     * Adds a new middleware to the current set
     * @param {Object}     opts       options
     * @param {String}     opts.name  Name of the middleware, can be used to delete it later
     * @param {Function}   opts.fn    Function for the middleware, applied for data transformation
     * @return {void}
     */
    add({name, fn}) {
        if (!name) {
            name = 'middleware_' + this.middleware.length;
        }
        this.middleware.push({name, fn});
        this.middlewareStream.onNext({name, fn});
    }

    /**
     * Removes existing middleware from the applied list
     * @param  {Object}  opts       options
     * @param  {String}  opts.name  Name of the middleware to remove
     * @return {void}
     */
    remove({name}) {
        this.deletedMiddleware.push(name);
    }

    /**
     * Removes all the middleware
     * @return {void}
     */
    clear() {
        // clean subject stuff
        this.middlewareStream.dispose();
        this.middlewareStream = new Rx.ReplaySubject();
        this.middleware = [];
        this.deletedMiddleware = [];
    }

    /**
     * Returns a stream of currently used middleware
     * @return {Rx.Observable}   Rx.Observable stream of currently used middleware
     */
    list() {
        return this.middlewareStream.filter(({name}) => this.deletedMiddleware.indexOf(name) === -1);
    }

    /**
     * Returns an Rx.Observable that transforms input value using applied middleware
     * @param  {Any}            val  Input value
     * @return {Rx.Observable}       Stream with resulting value
     */
    transform(val) {
        return this.middlewareStream
                    .filter(({name}) => this.deletedMiddleware.indexOf(name) === -1)
                    .startWith(val)
                    .scan((acc, {fn}) => fn(acc))
                    .throttle();
    }
}

/**
 * Export Middleware class
 */
export default Middleware;
