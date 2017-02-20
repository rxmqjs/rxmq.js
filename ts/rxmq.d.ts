import Channel from './channel'
import EndlessSubject from './endlessSubject'
import EndlessReplaySubject from './endlessReplaySubject'

declare namespace Rxmq {
    function channel<T>(name: String): Channel<T>

    function registerPlugin(plugin: Object): void

    function registerChannelPlugin(plugin: Object): void
}

export {Channel, EndlessSubject, EndlessReplaySubject};
export default Rxmq;