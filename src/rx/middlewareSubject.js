import {EndlessSubject} from './endlessSubject';
import Middleware from './middleware';

/**
 * MiddlewareSubject extension of EndlessSubject.
 */
class MiddlewareSubject extends EndlessSubject {
    constructor(...args) {
        super(...args);

        // middleware for self
        this.middleware = new Middleware();
        // middleware for request-response
        this.replyMiddleware = new Middleware();
        // middleware processing flags (since application is async)
        this.applyingMiddleware = false;
        this.completeAfterMiddleware = false;
    }

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

    onCompleted() {
        // if we're calculating middleware, just add flag and return
        if (this.applyingMiddleware) {
            this.completeAfterMiddleware = true;
            return;
        }
        super.onCompleted();
    }

    dispose() {
        // cleanup flags
        this.applyingMiddleware = false;
        this.completeAfterMiddleware = false;
        // dispose
        super.dispose();
    }
}

export {MiddlewareSubject};
