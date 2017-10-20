import { Observable, Subject, AsyncSubject } from 'rxjs';
import EndlessSubject from './endlessSubject';

export interface NewableSubject<U extends Subject<T>, T> {
    new(): U
}

export type RequestOptions<T, U extends Subject<R>, R> = {
    topic: string,
    data: T,
    Subject?: NewableSubject<U, R>
}

declare interface BaseChannel {
        new(plugins: Object[]): this
        registerPlugin(plugin: Object): void;
}

declare interface Channel<T> extends BaseChannel {
        observe(topic: String): Observable<T>
        subject(topic: String, subject?: EndlessSubject<T>): Subject<T>
}

declare interface RequestResponseChannel<Req,Res> extends BaseChannel {
    observe(topic: String): Observable<{data: Req, replySubject: Subject<Res>}>
    request<S extends Subject<Res>>(options: RequestOptions<Req, S, Res>): Subject<Res>
    subject(topic: String, subject?: EndlessSubject<Res>): Subject<Res>
}

export  {Channel, RequestResponseChannel};
