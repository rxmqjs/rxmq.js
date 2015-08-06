import Rx from 'rx';
import generateUuid from '../utils/generateUuid';

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
         * Array of deleted middleware ids
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
     * @param {Function}   fn    Function for the middleware, applied for data transformation
     * @return {Object}          Middlware object
     */
    add(fn) {
        const m = {
            id: generateUuid(),
            fn,
        };
        this.middleware.push(m);
        this.middlewareStream.onNext(m);
        return m;
    }

    /**
     * Removes existing middleware from the applied list
     * @param  {Object}  opts       Middlware object
     * @param  {String}  opts.id    Id of the middleware to remove
     * @return {void}
     */
    remove({id}) {
        this.deletedMiddleware.push(id);
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
        return this.middlewareStream.filter(({id}) => this.deletedMiddleware.indexOf(id) === -1);
    }

    /**
     * Returns an Rx.Observable that transforms input value using applied middleware
     * @param  {Any}            val  Input value
     * @return {Rx.Observable}       Stream with resulting value
     */
    transform(val) {
        return this.middlewareStream
                    .filter(({id}) => this.deletedMiddleware.indexOf(id) === -1)
                    .startWith(val)
                    .scan((acc, {fn}) => fn(acc))
                    .throttle();
    }
}

/**
 * Export Middleware class
 */
export default Middleware;
