import {EndlessSubject} from './endlessSubject';
import Middleware from './middleware';

/**
 * MiddlewareSubject extension of EndlessSubject.
 * This is an extension of EndlessSubject that provides a support for middleware on top of default logic.
 * In addition to all the Rx.Subject methods, you get access to `.middleware` and `.replyMiddleware` properties
 * that provide access to Middleware managers.
 *
 * For documentation on all methods refer to
 * [Rx.Subject docs](@link https://github.com/Reactive-Extensions/RxJS/blob/master/doc/api/subjects/subject.md).
 */
class MiddlewareSubject extends EndlessSubject {
    /**
     * Contructor function
     * @param  {Any}                args        Arguments to pass down to Rx.Subject contructor
     * @return {MiddlewareSubject}              New instance of MiddlewareSubject
     */
    constructor(...args) {
        super(...args);
        /**
         * Middleware for the current subject
         * @private
         */
        this.middleware = new Middleware();
        /**
         * Middleware for the replySubject used in request-response pattern
         * @private
         */
        this.replyMiddleware = new Middleware();
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
 * Export MiddlewareSubject class
 */
export {MiddlewareSubject};
