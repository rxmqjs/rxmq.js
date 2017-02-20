import { Observable, Subject, AsyncSubject } from 'rxjs';
import EndlessSubject from './endlessSubject';

export interface NewableSubject<T> {
    new(): Subject<T>
}

export type RequestOptions<U extends Subject<T>, T> = {
    topic: String,
    data?: any,
    Subject?: NewableSubject<T>
} 

declare class Channel<T> {
        constructor(plugins?: Array<Object>);
        observe<T>(topic: String): Observable<T>
        subject<T>(topic: String, subject?: EndlessSubject<T>): Subject<T>
        request<T,U extends Subject<T>>(options: RequestOptions<U,T>): U
        registerPlugin(plugin: Object): void;
}

export default Channel;