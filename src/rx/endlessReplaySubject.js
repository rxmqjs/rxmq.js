/* eslint no-param-reassign: [2, {"props": false}] */
import { ReplaySubject } from 'rxjs';

/**
 * EndlessReplaySubject extension of ReplaySubject.
 * This is pretty hacky, but so far I'd found no better way of having
 * Subjects that do no close on multicasted stream completion and on multiple errors.
 * For documentation refer to
 * [ReplaySubject doc](@link https://github.com/Reactive-Extensions/RxJS/blob/master/doc/api/subjects/replaysubject.md).
 * The only difference is that EndlessReplaySubject never triggers '.complete()' and
 * does not closes observers on errors (thus allowing to continuously dispatch them).
 */
class EndlessReplaySubject extends ReplaySubject {
  /**
   * Dummy method override to prevent execution and Observable completion
   * @return {void}
   */
  complete() {}

  /**
   * Override of error method that prevents stopping that Observer
   * @param  {Error} error  - Error to be dispatched
   * @return {void}
   */
  error(error) {
    // store error
    this.error = error;
    // dispatch to all observers
    this.observers.forEach(os => {
      // dispatch
      os.error(error);
      // mark observer as not stopped
      os.isStopped = false;
    });
  }
}

export { EndlessReplaySubject };
