import BaseComponent = require("./BaseComponent");
const { ccclass, property } = cc._decorator;

enum playingState {
    Init,//初始状态
    Drawing,//绘制直线中
    Rotateing,//旋转直线中
    PerSonAction,//人物正常过路中
    PerSonFail,//人物过路失败
    MoveScene,//移动场景
    GameOver,//游戏结束
}

@ccclass
class Game extends BaseComponent {

    @property({ tooltip: "跳台之间距离区间", type: [cc.Integer] })
    PlatFormDistanceList: number[] = [200, 500];

    @property({ tooltip: "跳台宽度区间", type: [cc.Integer] })
    PlatFormChangeList: number[] = [50, 100];

    @property({ tooltip: "绘制直线速度" })
    Draw_Speed: number = 300;

    @property({ tooltip: "绘制直线速度变速区间", type: [cc.Integer] })
    Draw_ChangeSpeedList: number[] = [-100, 100];

    @property({ tooltip: "一次性创建多少个站台" })
    InitCreatePlatFormCount: number = 6;

    @property({ tooltip: "棍子下落所需要的时间" })
    StickTime: number = 0.5;

    @property({ tooltip: "场景移动所需时间" })
    SceneTime: number = 1;

    @property({ tooltip: "棍子最大长度" })
    StickMaxLength: number = 1360;



    @property(cc.Prefab)
    nd_Line: cc.Prefab = null;

    @property(cc.Node)
    person: cc.Node = null;
    perAnimation: cc.Animation;

    nd_Login: cc.Node;
    nd_Rule: cc.Node;
    nd_GameOver: cc.Node;

    lb_point: cc.Label;


    InitPosX = -500;
    //站台缓存
    platFormNodePool: cc.NodePool = new cc.NodePool("PlatForm");
    //直线缓存
    lineNodePool: cc.NodePool = new cc.NodePool("Line");

    playState: playingState;

    point: number = 0;

    platFormList: cc.Node[] = [];

    LineList: cc.Node[] = [];

    currentLine: cc.Node;//当前移动木棍

    currentAllPlatFormNum = 0;
    OnLoad() {
        window["t"] = this;
        this.lb_point = cc.find("point/New Label", this.node).getComponent(cc.Label);
        this.nd_Login = cc.find("layout/denglu", this.node);
        this.nd_Login.getComponent("Login").game = this;
        this.nd_Rule = cc.find("layout/guize", this.node);
        this.nd_GameOver = cc.find("layout/jieshu", this.node);
        this.nd_GameOver.getComponent("UIEnd").game = this;
        this.perAnimation = this.person.getComponent(cc.Animation);
        this.nd_Login.active = true;
        this.nd_Rule.active = false;
        this.nd_GameOver.active = false;
        this.playState = playingState.Init;
        this.point = 0;
        this.lb_point.string = this.point.toString();
        this.Init();
        this.node.on("touchstart", this.OnPoker_TouchStart, this);
        this.node.on("touchend", this.OnPoker_TouchEnd, this);
        this.node.on("touchcancel", this.OnPoker_TouchCancel, this);
    }

    Init() {
        this.currentAllPlatFormNum = 0;
        this.RecycleAllPlatForm();
        this.RecycleAllLine();
        //初始化创建4个站台
        for (let i = 0; i < this.InitCreatePlatFormCount; i++) {
            let platFormNode = this.CreatePlatForm();
            if (i == 0) {
                platFormNode.x = this.InitPosX
            }
            else {
                platFormNode.x = this.platFormList[i - 1].x + this.RandInt(this.PlatFormDistanceList[0], this.PlatFormDistanceList[1]);
            }
            this.platFormList.push(platFormNode);
        }
        //人物站在第一站台
        let platFormNode1 = this.platFormList[0];
        this.person.x = platFormNode1.width * 0.5 + platFormNode1.x;
        this.person.y = platFormNode1.height + platFormNode1.y + this.person.height * 0.5;
        //木棍在第一站台
        this.currentLine = this.CreateLineNode();
        this.LineList.push(this.currentLine);
        this.currentLine.x = platFormNode1.width + platFormNode1.x;
        this.currentLine.y = platFormNode1.height + platFormNode1.y;
    }


    /** 直线旋转*/
    LineRotate() {
        this.currentLine.stopAllActions();
        this.currentLine.runAction(cc.sequence(cc.rotateTo(this.StickTime, 90), cc.callFunc(() => {
            this.playState = playingState.PerSonAction;
            this.perAnimation.play();
        })));
    }

    /**开始游戏 */
    StartGame() {
        this.playState = playingState.Init;
        this.point = 0;
        this.lb_point.string = this.point.toString();
        this.CloseEnd();
        this.Init();
    }


    update(dt) {
        if (this.playState == playingState.Drawing) {
            //已经到达最大长度 不在增加
            if (this.StickMaxLength <= this.currentLine.height) {
                return;
            }
            this.currentLine.height += dt * (this.Draw_Speed + this.RandInt(this.Draw_ChangeSpeedList[0], this.Draw_ChangeSpeedList[1]));
        }
        else if (this.playState == playingState.PerSonAction) {
            this.person.x += dt * this.Draw_Speed;
            if (this.person.x > this.currentLine.x + this.currentLine.height) {
                this.perAnimation.stop();
                let StayPlatFormNum = -1;
                //不用计算第一个
                for (let i = 1; i < this.platFormList.length; i++) {
                    let platForm = this.platFormList[i];
                    if (this.person.x >= platForm.x && this.person.x <= platForm.x + platForm.width) {
                        this.playState = playingState.Init
                        StayPlatFormNum = i;
                        break;
                    }
                }
                if (StayPlatFormNum > 0) {
                    this.playState = playingState.MoveScene;
                    this.MoveNextScene(StayPlatFormNum);
                }
                else {
                    this.playState = playingState.PerSonFail;
                }
            }
        }
        else if (this.playState == playingState.PerSonFail) {
            this.person.y -= dt * this.Draw_Speed * 5;
            if (this.person.y < -(this.node.height * 0.5 + this.person.height * 0.5)) {
                this.playState = playingState.GameOver;
                this.ShowEnd();
            }
        }
    }
    /**移动场景 */
    MoveNextScene(StayPlatFormNum) {
        let moveX = this.person.x - this.InitPosX;
        //人物后退
        this.person.runAction(cc.moveBy(this.SceneTime, cc.v2(-moveX, 0)));
        //站台后退
        for (let i = 0; i < this.platFormList.length; i++) {
            let platForm = this.platFormList[i];
            platForm.runAction(cc.moveBy(this.SceneTime, cc.v2(-moveX, 0)));
        }
        for (let i = 0; i < this.LineList.length; i++) {
            let line = this.LineList[i];
            line.runAction(cc.moveBy(this.SceneTime, cc.v2(-moveX, 0)));
        }
        this.scheduleOnce(() => {
            this.playState = playingState.Init;
            this.currentLine = this.CreateLineNode();
            this.LineList.push(this.currentLine);
            let platFormNode1 = this.platFormList[StayPlatFormNum];
            this.point = parseInt(platFormNode1.name.split("_")[1]);
            this.lb_point.string = this.point.toString();
            this.currentLine.x = platFormNode1.width + platFormNode1.x;
            this.currentLine.y = platFormNode1.height + platFormNode1.y;
            this.CheckRecycleNode();
        }, this.SceneTime)
    }
    /**检测有什么站台和棍棒可以回收 */
    CheckRecycleNode() {
        let needCreateCount = 0;
        for (let i = this.platFormList.length - 1; i >= 0; i--) {
            let platForm = this.platFormList[i];
            if (platForm.x + platForm.width < -this.node.width * 0.5) {
                this.platFormNodePool.put(platForm);
                this.platFormList.splice(i, 1);
                needCreateCount++;
            }
        }
        for (let i = 0; i < this.LineList.length; i++) {
            let line = this.LineList[i];
            if (line.x + line.height < -this.node.width * 0.5) {
                this.lineNodePool.put(line);
                this.LineList.splice(i, 1);
            }
        }
        for (let i = 0; i < needCreateCount; i++) {
            let platFormNode = this.CreatePlatForm();
            platFormNode.x = this.platFormList[this.platFormList.length - 1].x + this.RandInt(this.PlatFormDistanceList[0], this.PlatFormDistanceList[1]);
            this.platFormList.push(platFormNode);
        }
    }

    /**绘制站台 */
    CreatePlatForm(): cc.Node {
        let node: cc.Node = null;
        let ctx: cc.Graphics = null
        let widget: cc.Widget = null;
        if (this.platFormNodePool.size() > 0) {
            node = this.platFormNodePool.get();
            ctx = node.getComponent(cc.Graphics);
            widget = node.getComponent(cc.Widget);
        }
        else {
            node = new cc.Node("PlatForm");
            node.addComponent("PlatForm");
            ctx = node.addComponent(cc.Graphics);
            node.anchorX = 0;
            node.anchorY = 0;
            ctx.fillColor = new cc.Color(0, 0, 0);
            widget = node.addComponent(cc.Widget);
            widget.isAlignBottom = true;
            widget.bottom = 0;
            widget.alignMode = 2;
            node.height = 300;
        }
        node.name = `PlatForm_${this.currentAllPlatFormNum}`;
        this.currentAllPlatFormNum++;
        node.width = this.RandInt(this.PlatFormChangeList[0], this.PlatFormChangeList[1])
        node.parent = this.node;
        node.setSiblingIndex(2);
        widget.updateAlignment();
        ctx.rect(0, 0, node.width, node.height);
        ctx.fill();
        return node;
    }

    /**创建直线节点 */
    CreateLineNode(): cc.Node {
        let node: cc.Node = null;
        if (this.lineNodePool.size() > 0) {
            node = this.lineNodePool.get();
        }
        else {
            node = cc.instantiate(this.nd_Line)
            node.addComponent("Line");
        }
        node.parent = this.node;
        node.setSiblingIndex(2);
        return node;
    }
    /**回收所有站台 */
    RecycleAllPlatForm() {
        for (let i = this.node.children.length - 1; i >= 0; i--) {
            let node = this.node.children[i];
            let name: any = node.name;
            if (name.startsWith("PlatForm")) {
                this.platFormNodePool.put(node)
            }
        }
        this.platFormList = [];
    }
    /**回收所有木棍 */
    RecycleAllLine() {
        for (let i = this.node.children.length - 1; i >= 0; i--) {
            let node = this.node.children[i];
            if (node.name == "gunzi") {
                this.lineNodePool.put(node)
            }
        }
        this.LineList = [];
    }

    OnPoker_TouchStart(event) {
        if (this.playState == playingState.Init) {
            this.playState = playingState.Drawing
        }
    }
    OnPoker_TouchEnd(event) {
        if (this.playState == playingState.Drawing) {
            this.playState = playingState.Rotateing;
            this.LineRotate();
        }
    }
    OnPoker_TouchCancel(event) {
        this.OnPoker_TouchEnd(event);
    }

    CloseRule() {
        this.nd_Rule.active = false;
    }

    ShowRule() {
        this.nd_Rule.active = true;
    }

    CloseEnd() {
        this.nd_GameOver.active = false;
    }

    ShowEnd() {
        this.nd_GameOver.active = true;
        let UIEnd = this.nd_GameOver.getComponent("UIEnd");
        let MaxPoint = cc.sys.localStorage.getItem("MaxPoint");
        MaxPoint = Math.max(MaxPoint, this.point);
        cc.sys.localStorage.setItem("MaxPoint", MaxPoint);
        UIEnd.ShowPoint();
    }

    OnClick() {

    }

    //列表随机1个出来
    RandInt(start: number, end: number) {
        return Math.floor(Math.random() * (end + 1 - start) + start);
    }
}
export = Game;