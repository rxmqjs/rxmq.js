import Rxmq from './rxmq';
import {Channel, RequestResponseChannel} from './rxmq';

const messageChannel = Rxmq.channel<Channel<string>, string, void>('channel1');
messageChannel.observe('test').subscribe((data: string) => console.log(data));
messageChannel.subject('test').next('foo');

const requestChannel = Rxmq.channel<RequestResponseChannel<string, number>, string, number>('channel2');
requestChannel.observe('test').subscribe(({data, replySubject}) => replySubject.next(data.length));
requestChannel.request({topic: 'test', data: 'foo'}).subscribe((data: number) => console.log(data));
