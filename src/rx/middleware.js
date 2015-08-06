import Rx from 'rx';

class Middleware {
    constructor() {
        this.middleware = [];
        this.middlewareStream = new Rx.ReplaySubject();
    }

    add({name, fn}) {
        if (!name) {
            name = 'middleware_' + this.middleware.length;
        }
        this.middleware.push({name, fn});
        this.middlewareStream.onNext({name, fn});
    }

    clear() {
        // clean subject stuff
        this.middlewareStream.dispose();
        this.middlewareStream = new Rx.ReplaySubject();
        this.middleware = [];
    }

    list() {
        return this.middlewareStream;
    }

    transform(val) {
        return this.middlewareStream
                    .startWith(val)
                    .scan((acc, {fn}) => fn(acc))
                    .throttle();
    }
}

export default Middleware;
