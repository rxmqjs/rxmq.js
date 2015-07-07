import Rx from 'rx';

/**
 * EndlessSubject extension of Rx.Subject.
 * This is pretty hacky, but so far I'd found no better way of having
 * Subjects that do no close on multicasted stream completion.
 * For documentation refer to
 * [Rx.Subject docs](@link https://github.com/Reactive-Extensions/RxJS/blob/master/doc/api/subjects/subject.md).
 * The only difference is that EndlessSubject never triggers '.onCompleted()'
 */
class EndlessSubject extends Rx.Subject {
    /**
     * Dummy method override to prevent execution and Rx.Observable completion
     * @return {void}
     */
    onCompleted() {}
}

export {EndlessSubject};
