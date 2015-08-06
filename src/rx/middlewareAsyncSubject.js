import Rx from 'rx';
import Middleware from './middleware';

/**
 * MiddlewareAsyncSubject extension of Rx.AsyncSubject.
 * This is an extension of Rx.AsyncSubject that provides a support for middleware on top of default logic.
 * In addition to all the Rx.AsyncSubject methods, you get access to `.middleware` property
 * that provides access to Middleware manager.
 *
 * For documentation on all methods refer to
 * [official docs](@link https://github.com/Reactive-Extensions/RxJS/blob/master/doc/api/subjects/asyncsubject.md).
 */
class MiddlewareAsyncSubject extends Rx.AsyncSubject {
    /**
     * Contructor function
     * @param  {Any}                        args        Arguments to pass down to Rx.AsyncSubject contructor
     * @return {MiddlewareAsyncSubject}                 New instance of MiddlewareAsyncSubject
     */
    constructor(...args) {
        super(...args);
        /**
         * Middleware for the current subject
         * @private
         */
        this.middleware = new Middleware();
        /**
         * Flag indicating that we're currently processing a value using middleware
         * @type {Boolean}
         * @private
         */
        this.applyingMiddleware = false;
        /**
         * Flag indicating that we need to call `onCompleted()` method after processing with middleware
         * @type {Boolean}
         * @private
         */
        this.completeAfterMiddleware = false;
    }

    /**
     * Override of the parent `onNext` function.
     * Applies current middleware on the given value and then passes it to parent `onNext` function.
     * @param  {Any}   val  Input value
     * @return {void}
     */
    onNext(val) {
        // say we're doing middleware work so that onCompleted won't close before we're done
        this.applyingMiddleware = true;
        // do work
        this.middleware
            .transform(val)
            .subscribe((newVal) => {
                // say we're done
                this.applyingMiddleware = false;
                // dispatch value
                super.onNext(newVal);
                // check if we need to complete
                if (this.completeAfterMiddleware) {
                    super.onCompleted();
                }
            });
    }

    /**
     * Override of the parent `onCompleted` function.
     * Checks if middleware processing is in effect and sets the flag to complete after it's done.
     * @return {void}
     */
    onCompleted() {
        // if we're calculating middleware, just add flag and return
        if (this.applyingMiddleware) {
            this.completeAfterMiddleware = true;
            return;
        }
        super.onCompleted();
    }

    /**
     * Override of the parent `dispose` method.
     * Adds resets for flags used for middleware processing.
     * @return {void}
     * @private
     */
    dispose() {
        // cleanup flags
        this.applyingMiddleware = false;
        this.completeAfterMiddleware = false;
        // dispose
        super.dispose();
    }
}

/**
 * Export MiddlewareAsyncSubject class
 */
export {MiddlewareAsyncSubject};
