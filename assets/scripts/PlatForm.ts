import BaseComponent = require("./BaseComponent");

const { ccclass } = cc._decorator;
@ccclass
class PlatForm extends BaseComponent {
   
    //放入缓存池
    unuse() {
        this.node.getComponent(cc.Graphics).clear();
    }
    //复用
    reuse() {

    }
}