import BaseComponent = require("./BaseComponent");
const { ccclass, property } = cc._decorator;

@ccclass
export class Sound extends BaseComponent {

    backGroundVolume: number = 1;
    /**人物移动音效ID */
    runSoundNum: number;
    /**棍子生成音效ID*/
    stackupSoundNum: number;
    @property({ tooltip: "背景音乐", type: cc.AudioClip })
    background: cc.AudioClip = null;

    @property({ tooltip: "按钮音效", type: cc.AudioClip })
    anniu: cc.AudioClip = null;

    @property({ tooltip: "棍子生成", type: cc.AudioClip })
    stackup: cc.AudioClip = null;

    @property({ tooltip: "棍子落下", type: cc.AudioClip })
    stackdown: cc.AudioClip = null;

    @property({ tooltip: "人物下落", type: cc.AudioClip })
    personDown: cc.AudioClip = null;

    @property({ tooltip: "人物行动", type: cc.AudioClip })
    personRun: cc.AudioClip = null;

    @property({ tooltip: "获得分数", type: cc.AudioClip })
    getScore: cc.AudioClip = null;

    OnLoad() {
        this.backGroundVolume = cc.sys.localStorage.getItem("volume") || 1;
        cc.audioEngine.setMusicVolume(this.backGroundVolume);
        cc.audioEngine.setEffectsVolume(this.backGroundVolume);
        this.PlayBackGround();
    }

    PlayBackGround() {
        cc.audioEngine.playMusic(this.background, true);
    }

    PlayOnClick() {
        if(cc.audioEngine.getEffectsVolume()){
            cc.audioEngine.playEffect(this.anniu, false)
        }
    }

    /**播放棍子生成 */
    PlayStackUp() {
        if(cc.audioEngine.getEffectsVolume()){
            this.stackupSoundNum = cc.audioEngine.playEffect(this.stackup, true)

        }
    }
    /**停止人物行动播放音效 */
    StopStackUp() {
        cc.audioEngine.stopEffect(this.stackupSoundNum)
    }

    /**播放棍子落下 */
    PlayStackDown() {
        if(cc.audioEngine.getEffectsVolume()){
            cc.audioEngine.playEffect(this.stackdown, false)
        }
    }
    /**播放人物下落 */
    PlayDown() {
        if(cc.audioEngine.getEffectsVolume()){
            cc.audioEngine.playEffect(this.personDown, false)
        }
    }
    /**播放人物行动 */
    PlayRun() {
        if(cc.audioEngine.getEffectsVolume()){
            this.runSoundNum = cc.audioEngine.playEffect(this.personRun, true)
        }
    }
    /**停止人物行动播放音效 */
    StopPersonRun() {
        cc.audioEngine.stopEffect(this.runSoundNum)
    }

    /**播放获得分数音效 */
    PlayGetScore(){
        if(cc.audioEngine.getEffectsVolume()){
            cc.audioEngine.playEffect(this.getScore, false)
        }
    }
}

