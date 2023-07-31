class Chat {
    data?: any
    plugName?: string
    config = {
        keyWord: {} as any,
        parses: [] as IChatSplitKeyWordEvent[]
    }
    funs: IAppFun[] = []
    events: IAppFunOperateEvent[] = []
    constructor() {
    }
    /**
     * 聊天参数文本转正则
     * @param str 聊天参数
     * @returns 正则
     */
    chatParameterTextToReg(str: string) {
        const fls = str.match(/.{2}/g);
        const ars = (Array as any).from(fls as any) as string[];
        str = ars.map(str => `{{${this.config.keyWord[str]}}}`).join('');``
        str = str.replace(/^[\r\s\n\t]+/, '').replace(/[\r\s\n\t]+$/, '');
        //str = str.format(this.config.keyWord);
        return new RegExp(`^${str}$`);
    }


    newlMR(element: IChatSplitKeyWord, source1?: any, target1?: any, source2?: any, target2?: any, source3?: any, target3?: any): any {
        const el = JSON.parse(JSON.stringify(element));
        source1 && (el.reg_source = el.reg_source.replace(source1, target1));
        source2 && (el.reg_source = el.reg_source.replace(source2, target2));
        source3 && (el.reg_source = el.reg_source.replace(source3, target3));
        el.reg = this.chatParameterTextToReg(el.reg_source);
        return el;
    }

    /**
     * 下一次执行
     * @param start 开始
     * @param end 结束
     * @param callBack 过程回调 
     * @param exitCallBack 结束回调 
     */
    next(start: number, end: number, callBack?: (start: number, next: () => void) => void, exitCallBack?: () => void): void {
        (function next(start) {
            if (start > end) exitCallBack && exitCallBack();
            else callBack && callBack(start, () => next(start + 1));
        })(start)
    }

    chatTextToEvent(str: string, callBack: (events: IAppFunOperateEvent[] | null) => void) {
        let result: any = null;
        for (let exIndex = 0, exLen = this.config.parses.length; exIndex < exLen; exIndex++) {
            // 匹配成功
            if (result) return;

            const exElement = this.config.parses[exIndex];
            for (let regIndex = 0, regLen = exElement.regs.length; regIndex < regLen; regIndex++) {
                // 匹配成功
                if (result) return;
                const regElement = exElement.regs[regIndex] as any;
                const { reg, reg_source, value_source } = regElement;
                const res = reg.exec(str);
                if (!res) continue;

                const args: any[] = [];
                value_source.map((p: any, i: number) => {
                    if (i >= exElement.value_source_place.length) return;
                    const pa: any = value_source[i];
                    const pb: any = exElement.value_source_place[i];
                    const pv: any = pa == -1 ? pb : res[pa];
                    args.push(pv);
                });

                result = args;

                const chatEvent: IAppFunOperateEvent = {
                    method: exElement.eventName,
                    eventName: exElement.eventName,
                    eventParameters: args,
                    chatContents: [str],
                    startField: args[0],
                    position: args[1],
                    operateNum: -1,
                    operateField: ''
                };

                callBack([chatEvent]);
            }
        }

        !result && callBack(result);
    }

    runFun(fun: IAppFun, content: string, callBack: (err: Error | null, data?: IAppMessageInfo) => void) {
        this.chatTextToEvent(content, (events) => {
            if (events) {
                (fun as any)[events[0].method](...events[0].eventParameters, callBack);
            }
            else {
                callBack({ message: '对不起，我还没学会这个技能，您可以试试其他方式！' } as Error);
            }
        });
    }

    run(content: string, callBack: (err: Error | null, data?: IAppMessageInfo, templatePath?: string) => void) {


        if (/^\s*谢\s*谢\s*[你您啊哦呀牙yao!.。]*$/i.test(content)) {
            this.funs.map(fun => fun.data = null);
            this.events.length = 0;
            return callBack(null, { contents: `不客气，您可以选择继续对话，或者对我说重新开始，来使用其它功能。` });
        }

        if (/^[你您!.。]*\s*真\s*棒\s*[你您啊哦呀牙yao!.。]*$/.test(content)) {
            this.funs.map(fun => fun.data = null);
            this.events.length = 0;
            return callBack(null, { contents: `谢谢您，持续关注我，可以体验新功能哟！` });
        }

        if (content === 'init') {
            this.funs.map(fun => fun.data = null);
            this.events.length = 0;
        }

        if (content === '重新开始') {
            this.funs.map(fun => fun.data = null);
            this.events.length = 0;
            return callBack(null, { contents: '好的，已经重新开始了，需要我为您做什么呢？' });
        }



        if (this.events.length == 0) {
            let fun: IAppFun | undefined;
            this.funs.some(p => {
                const status = p.aliass.some(key => {
                    const typeRegStatus = Object.prototype.toString.call(key) === `[object RegExp]`;
                    if (typeRegStatus) {
                        return (key as unknown as RegExp).test(this.plugName || content);
                    }
                    return content.indexOf(key) > -1;
                });
                status && (fun = p);

                return status;
            });

            if (!fun) return callBack({ message: '对不起，我不能理解您的意思！' } as Error);
            if (this.data) fun.setData(this.data);
            if (fun.goto) {
                return fun.goto(content, callBack)
            };

            this.events.push({
                fun: fun as any,
                eventName: "",
                eventParameters: [],
                chatContents: [],
                method: "",
                startField: "",
                position: "",
                operateNum: 0,
                operateField: ""
            });
            if (!this.plugName)
                return callBack(null, { contents: fun.operateMessage })
        }

        if (this.data) {
            (this.events[0].fun as any).setData(this.data);
        }

        if (!this.events[0].fun?.data) {
            (this.events[0].fun as any).setData(content);
            return callBack(null, { contents: (this.events[0].fun as IAppFun).operateMessageStart })
        }
        this.runFun(this.events[0].fun as any, content, callBack);

    }
}

export default class PrvtChat extends Chat {

    constructor() {
        super()
    }
    run(content: string, callBack: (err: Error | null, data?: IAppMessageInfo, templatePath?: string) => void): void {
        super.run(content, callBack);
    }
}