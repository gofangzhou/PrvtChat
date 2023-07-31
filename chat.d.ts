type TAppFun = '字符串操作' | string
type TAppFunOperateMethod = 'add' | 'delete' | 'modify' | 'select' | 'sort' | 'replace' | 'compare' | 'convert' | ''
type TAppFunOperatePosition = 'left' | 'top' | 'right' | 'bottom' | 'center' | 'first' | 'last' | ''

/** 消息 */
interface IAppMessageInfo {
    contents: string | string[]
    contentType?: 'text' | 'html' = 'html'
    source?: string
    plug?: string
}

interface IAppFunOperateMethod {
    // 操作方式
    method: TAppFunOperateMethod
    // 开始字段
    startField: string
    // 位置
    position: TAppFunOperatePosition
    // 操作数量
    operateNum: number
    //操作字段
    operateField: string
}

interface IAppFunOperateEvent extends IAppFunOperateMethod {
    eventName: string
    eventParameters: any[]
    chatContents: string[]
    fun?: IAppFun
}

interface IAppFun {
    // 功能名称 
    name: TAppFun,
    // 功能关键词
    aliass: string[]
    // 操作方式
    methods: IAppFunOperateMethod[],
    // 数据
    data: any
    operateMessage: string | string[]
    operatePlug?: string = ''
    operateMessageStart: string | string[]
    setRequest?: (req: any) => void

    setData: (source: string) => void
    goto?: (chatContent: string, callBack: (err: Error | null, data?: IAppMessageInfo, templatePath?: string) => void) => void
}

interface IChatSplitKeyWord {
    reg?: RegExp
    reg_source: string
    value_source: number[]
}

interface IChatSplitKeyWordEvent {
    regs: IChatSplitKeyWord[],
    eventName: TAppFunOperateMethod,
    value_source_place: any[]
}