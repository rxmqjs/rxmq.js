import { AsyncSubject, Observable } from 'rxjs';
import { publishReplay, refCount, filter, mergeAll, share } from 'rxjs/operators';
import { EndlessSubject, EndlessReplaySubject } from './rx/index';
import { findSubjectByName, compareTopics } from './utils/index';

/**
 * Rxmq channel class
 */
class Channel {
  /**
   * Represents a new Rxmq channel.
   * Normally you wouldn't need to instantiate it directly, you'd just work with existing instance.
   * @constructor
   * @param  {Array}   plugins  Array of plugins for new channel
   * @return {void}
   */
  constructor(plugins = []) {
    /**
     * Internal set of utilities
     * @type {Object}
     * @private
     */
    this.utils = {
      findSubjectByName,
      compareTopics,
    };

    /**
     * Instances of subjects
     * @type {Array}
     * @private
     */
    this.subjects = [];
    /**
     * Channel bus
     * @type {EndlessReplaySubject}
     * @private
     */
    this.channelBus = new EndlessReplaySubject();
    /**
     * Permanent channel bus stream as Observable
     * @type {Observable}
     * @private
     */
    this.channelStream = this.channelBus.pipe(
      share()
    );

    // inject plugins
    plugins.map(this.registerPlugin.bind(this));
  }

  /**
   * Returns EndlessSubject representing given topic
   * @param  {String}         name           Topic name
   * @return {EndlessSubject}             EndlessSubject representing given topic
   * @example
   * const channel = rxmq.channel('test');
   * const subject = channel.subject('test.topic');
   */
  subject(name, { Subject = EndlessSubject } = {}) {
    let s = this.utils.findSubjectByName(this.subjects, name);
    if (!s) {
      s = new Subject();
      s.name = name;
      this.subjects.push(s);
      this.channelBus.next(s);
    }
    return s;
  }

  /**
   * Get an Observable for specific set of topics
   * @param  {String}         name        Topic name / pattern
   * @return {Observable}                 Observable for given set of topics
   * @example
   * const channel = rxmq.channel('test');
   * channel.observe('test.topic')
   *        .subscribe((res) => { // default Observable subscription
   *            // handle results
   *        });
   */
  observe(name) {
    // create new topic if it's plain text
    if (name.indexOf('#') === -1 && name.indexOf('*') === -1) {
      return this.subject(name);
    }
    // return stream
    return this.channelStream.pipe(
      filter(obs => compareTopics(obs.name, name)),
      mergeAll()
    );
  }

  /**
   * Do a request that will be replied into returned AsyncSubject
   * Alias for '.request()' that uses single object as params
   * @param  {Object}  options                   Request options
   * @param  {String}  options.topic             Topic name
   * @param  {Any}     options.data              Request data
   * @param  {Object}  options.DefaultSubject    Response subject, defaults to AsyncSubject
   * @return {AsyncSubject}                      AsyncSubject that will dispatch the response
   * @example
   * const channel = rxmq.channel('test');
   * channel.requestTo({
   *     topic: 'test.topic',
   *     data: 'test data',
   * }).subscribe((response) => { // default Observable subscription
   *     // handle response
   * });
   */
  request({ topic, data, Subject = AsyncSubject }) {
    const subj = this.utils.findSubjectByName(this.subjects, topic);
    if (!subj) {
      return Observable.never();
    }

    // create reply subject
    const replySubject = new Subject();
    subj.next({ replySubject, data });
    return replySubject;
  }

  /**
   * Channel plugin registration
   * @param  {Object} plugin Plugin object to apply
   * @return {void}
   */
  registerPlugin(plugin) {
    for (const prop in plugin) {
      if (!this.hasOwnProperty(prop)) {
        /**
         * Hide from esdoc
         * @private
         */
        this[prop] = plugin[prop];
      }
    }
  }
}

/**
 * Channel definition
 */
export default Channel;
