import {Channel, RequestResponseChannel} from './channel'
import EndlessSubject from './endlessSubject'
import EndlessReplaySubject from './endlessReplaySubject'

type ChannelType<T,R> = Channel<T> | RequestResponseChannel<T,R>

declare namespace Rxmq {
    function channel<T extends ChannelType<U,V>, U, V>(name: String): T

    function registerPlugin(plugin: Object): void

    function registerChannelPlugin(plugin: Object): void
}

export {Channel, RequestResponseChannel, EndlessSubject, EndlessReplaySubject};
export default Rxmq;