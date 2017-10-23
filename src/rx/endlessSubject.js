/* eslint no-param-reassign: [2, {"props": false}] */
import Rx from 'rxjs/Rx';

/**
 * EndlessSubject extension of Rx.Subject.
 * This is pretty hacky, but so far I'd found no better way of having
 * Subjects that do no close on multicasted stream completion and on multiple errors.
 * For documentation refer to
 * [Rx.Subject docs](@link https://github.com/Reactive-Extensions/RxJS/blob/master/doc/api/subjects/subject.md).
 * The only difference is that EndlessSubject never triggers '.complete()' and
 * does not closes observers on errors (thus allowing to continuously dispatch them).
 */
class EndlessSubject extends Rx.Subject {
  /**
     * Dummy method override to prevent execution and Rx.Observable completion
     * @return {void}
     */
  complete() {}

  /**
     * Override of error method that prevents stopping that Rx.Observer
     * @param  {Error} error  - Error to be dispatched
     * @return {void}
     */
  error(error) {
    this.thrownError = error;
    // dispatch to all observers
    this.observers.forEach(os => {
      // dispatch directly to destination
      os.destination._error.call(os.destination._context, error);
    });
  }
}

export {EndlessSubject};
