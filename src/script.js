/*
 * @Descripttion: 
 * @version: 
 * @Author: XYK
 * @Date: 2021-09-09 14:42:56
 * @LastEditors: XYK
 * @LastEditTime: 2021-09-10 14:29:19
 */
import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';
import * as GUI from 'babylonjs-gui';

const canvas = document.querySelector('#renderCanvas')
const engine = new BABYLON.Engine(canvas, true, { stencil: true })
const { scene, camera } = createScene()
let pickedMesh = null // 当前选中的元素
// 光照
const light = new BABYLON.HemisphericLight(new BABYLON.Vector3(0, 1, 0))
initField()
engine.runRenderLoop(function () {
    scene.render();
});
// 监听浏览器resize事件
window.addEventListener("resize", function () {
    engine.resize();
});

// 加载模型
importModels().then(models=>{
    console.log('模型加载完成')
    const meshes = models[0].meshes
    // 增加高亮渲染层.
    const hl = new BABYLON.HighlightLayer("hl1", scene);
    // 初始化GUI
    const {picker} = initGUI()
    meshes.filter(mesh => mesh.material).forEach(mesh => {
    mesh.isPickable = true
    setMeshActions(mesh,hl,picker)
    })
})
// 创建视图
function createScene() {
    // 主视图
    const scene = new BABYLON.Scene(engine)
    // 相机
    var camera = new BABYLON.ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 2000,new BABYLON.Vector3(0,500,0));
    camera.wheelDeltaPercentage = 0.01 // 滚轮速度
    camera.attachControl(canvas, true);
    camera.zoomToMouseLocation = true
    camera.useAutoRotationBehavior = true // 自旋转
    return { scene, camera }
}
// 绘制环境
function initField(){
    const ground = BABYLON.MeshBuilder.CreateGround("ground", {width:1000, height:1000});
    ground.position = new BABYLON.Vector3(0,-80,0)
}
// 加载模型
function importModels(models) {
    return new Promise((resolve,reject)=>{
        const models = []
        BABYLON.SceneLoader.ImportMeshAsync("", "/models/sazabi_ver.ka/", "scene.gltf").then(res=>{
           models.push(res)
           resolve(models)
       })

       const cube = BABYLON.MeshBuilder.CreateBox('box1',{size:100})
       setMeshActions(cube)
    })
}
// 模型交互事件
function setMeshActions(mesh,hl,picker) {
    mesh.actionManager = new BABYLON.ActionManager(scene);
    mesh.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
            {
                trigger: BABYLON.ActionManager.OnPointerOverTrigger,
            },
            function (e) {
                const dpic = scene.pick(scene.pointerX, scene.pointerY);
                hl.removeAllMeshes() //清除其他高亮
                hl.addMesh(dpic.pickedMesh, BABYLON.Color3.Green())
            }
        )
    );
    mesh.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
            {
                trigger: BABYLON.ActionManager.OnPickTrigger,
            },
            function (e) {
                const dpic = scene.pick(scene.pointerX, scene.pointerY);
                pickedMesh = dpic.pickedMesh
                picker.text = pickedMesh.name
                picker.value = pickedMesh.material.albedoColor || pickedMesh.material.diffuseColor ;
                hl.removeAllMeshes()
            }
        )
    );
}
// 初始化GUI
function initGUI() {
    var advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI',true,scene)
    var panel = new GUI.StackPanel();
    panel.width = "200px";
    panel.isVertical = true;
    panel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    panel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    advancedTexture.addControl(panel);
    // 文本框
    const textBlock = new GUI.TextBlock();
    textBlock.text = "Diffuse color:";
    textBlock.height = "30px";
    panel.addControl(textBlock);
    // 颜色选择器
    const picker = new GUI.ColorPicker();
    picker.height = "150px";
    picker.width = "150px";
    picker.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    picker.onValueChangedObservable.add(function (value) { // value is a color3
        // console.log(pickedMesh.material)
        if (!pickedMesh) return
        if(pickedMesh.material.albedoColor)
        pickedMesh.material.albedoColor.copyFrom(value);
        else 
        pickedMesh.material.diffuseColor.copyFrom(value);
    });
    panel.addControl(picker);
    // 按钮
    const button = new GUI.Button()
    button.height = "150px"
    button.width = "150px";
    button.onPointerClickObservable.add(res=>{
        changeMaterial()
    })
    panel.addControl(button)
    return {picker}
}
// 创建材质
function createMaterial() {
    const material = new BABYLON.StandardMaterial();
    material.diffuseTexture = new BABYLON.Texture("/texture/fur.jpg");
    console.log(material.diffuseTexture)
    return material
}
// 切换材质
function changeMaterial() {
    const material= createMaterial()
    pickedMesh.material = material
}
