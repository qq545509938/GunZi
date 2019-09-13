import Game = require("./Game");
import BaseComponent = require("./BaseComponent");

const { ccclass } = cc._decorator;
@ccclass
class Login extends BaseComponent {

    game: Game;
    toggle_yinyue: cc.Toggle;
    OnLoad() {
        this.JS_Name = "Login";
        this.toggle_yinyue = cc.find("yinyue", this.node).getComponent(cc.Toggle);
        let music = cc.sys.localStorage.getItem("Music");
        this.toggle_yinyue.isChecked = music == "0" ? true : false;
        this.SelectSoundValue();
    }

    /**开始游戏 */
    StartGame() {
        this.node.active = false;
    }
    /**显示规则 */
    ShowRule() {
        this.game.ShowRule();
    }

    /**打开或关闭音乐 */
    SelectSoundValue() {
        if (this.toggle_yinyue.isChecked) {
            cc.audioEngine.setMusicVolume(0);
            cc.audioEngine.setEffectsVolume(0);
            cc.sys.localStorage.setItem("Music", "0");
        }
        else {
            cc.audioEngine.setMusicVolume(1);
            cc.audioEngine.setEffectsVolume(1);
            cc.sys.localStorage.setItem("Music", "1");
        }
    }

}