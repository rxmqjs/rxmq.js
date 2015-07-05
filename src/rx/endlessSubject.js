import Rx from 'rx';

// this is pretty hacky, but so far I'd found no better way of having
// subjects that do no close on multicasted stream completion
class EndlessSubject extends Rx.Subject {
    onCompleted() {}
}

export {EndlessSubject};
