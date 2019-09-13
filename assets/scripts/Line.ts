import BaseComponent = require("./BaseComponent");

const { ccclass } = cc._decorator;
@ccclass
class Line extends BaseComponent {
    onload() {
    }

    //放入缓存池
    unuse() {
        this.node.height = 0;
        this.node.rotation = 0;
    }
    //复用
    reuse() {
        this.node.height = 0;
        this.node.rotation = 0;
    }
}