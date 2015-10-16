'use strict';

import { syscall } from '../syscall';


export class FSReqWrap {
	oncomplete: (err: any, ...rest: any[])=>void = undefined;
	context: any = undefined;

	constructor() {
	}

	complete(...args: any[]): void {
		this.oncomplete.apply(this, arguments);
	}
}

export function FSInitialize() {
}

export function open(path: string, flags: string, mode: number, req: FSReqWrap): void {
	syscall.open(path, flags, mode, req.complete.bind(req));
}

export function fstat(): void {
	console.log('TODO: fstat');
}

export function read(fd: number, buffer: any, offset: number, len: number, pos: number, req: FSReqWrap): void {
	if (typeof pos === 'undefined')
		pos = -1;
	syscall.pread(fd, len, pos, function readFinished(err: any, data: string): void {
		if (err) {
			req.complete(err, null);
			return;
		}
		buffer.write(data, 0, data.length, 'utf-8');
		try {
			req.complete(null, data.length);
		} catch (e) {
			console.log('blerg');
			console.log(e);
		}
	});
}

export function writeBuffer(fd: number, buffer: any, offset: number, len: number, pos: number, req: FSReqWrap): void {
	let str = buffer.toString('utf-8', offset, offset+len);
	syscall.pwrite(fd, str, pos, req.complete.bind(req));
}

// FIXME: be efficient
export function writeBuffers(fd: number, chunks: any, pos: number, req: FSReqWrap): void {
	let errored = false;
	let done = 0;
	let written = 0;
	function chunkComplete(err: any, count: number): void {
		done++;
		if (err && !errored) {
			req.complete(err, undefined);
			errored = true;
			return;
		}
		written += count;
		if (done === chunks.length)
			req.complete(null, written);
	}
	for (let i = 0; i < chunks.length; i++) {
		let chunkReq = new FSReqWrap();
		chunkReq.oncomplete = chunkComplete;
		writeBuffer(fd, chunks[i], 0, chunks[i].length, undefined, chunkReq);
	}
}

export function close(fd: number, req: FSReqWrap): void {
	syscall.close(fd, req.complete.bind(req));
}