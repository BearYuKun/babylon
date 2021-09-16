/*
    * @Descripttion:
    * @version:
    * @Author: XYK
    * @Date: 2021-09-09 14:42:56
 * @LastEditors: XYK
 * @LastEditTime: 2021-09-16 16:21:11
    */
import * as BABYLON from 'babylonjs'
import 'babylonjs-loaders'
import * as GUI from 'babylonjs-gui'

let canvas, engine, scene, camera, light, pickedMesh, picker, model, hl, panel
const clientHeight = document.body.clientHeight// 网页可见区域宽
const clientWidth = document.body.clientWidth// 网页可见区域宽
init()

async function init () {
  canvas = document.querySelector('#renderCanvas')
  engine = new BABYLON.Engine(canvas, true, { stencil: true })
  scene = new BABYLON.Scene(engine)
  // 相机
  camera = new BABYLON.ArcRotateCamera('Camera', Math.PI / 2, Math.PI / 2, 2000, new BABYLON.Vector3(0, 500, 0))
  camera.wheelDeltaPercentage = 0.01 // 滚轮速度
  camera.attachControl(canvas, true)
  camera.useAutoRotationBehavior = true // 自旋转
  camera.upperBetaLimit = Math.PI / 2.2 // 限制旋转
  // 光照
  // light = new BABYLON.HemisphericLight(new BABYLON.Vector3(1, 1, 0))
  light = new BABYLON.PointLight('light', new BABYLON.Vector3(0, 1, 0), scene)
  // 场景
  initField()
  // 形状
  // const cube = BABYLON.MeshBuilder.CreateBox('box1', { size: 1000 })
  // cube.material = createMaterial()
  // cube.position = new BABYLON.Vector3(1100, 500, 0)
  // const ball = BABYLON.MeshBuilder.CreateSphere('ball1', { segments: 20, diameter: 1000 })
  // ball.material = createMaterial()
  // ball.position = new BABYLON.Vector3(-1000, 500, 0)
  // const merge = BABYLON.Mesh.MergeMeshes([cube, ball])

  // 增加高亮渲染层.
  hl = new BABYLON.HighlightLayer('hl1', scene)

  // 模型
  model = await importModel('/models/sazabi_ver.ka/')
  const meshes = model.meshes
  // 初始化GUI
  initGUI()
  meshes.filter(mesh => mesh.material).forEach(mesh => {
    mesh.isPickable = true
    setMeshActions(mesh)
    mesh.material = changeMaterial(mesh.material)
  })

  engine.runRenderLoop(function () {
    scene.render()
  })
  // 监听浏览器resize事件
  window.addEventListener('resize', function () {
    engine.resize()
  })
}

// 绘制环境
function initField () {
  const ground = BABYLON.MeshBuilder.CreateGround('ground', { width: 1000, height: 1000 })
  ground.position = new BABYLON.Vector3(0, -80, 0)
  ground.material = createMaterial()
  // initSkyBox()
}

// 天空盒
function initSkyBox () {
  // Skybox
  const skybox = BABYLON.MeshBuilder.CreateBox('skyBox', { size: 10000.0 }, scene)
  const skyboxMaterial = new BABYLON.StandardMaterial('skyBox', scene)
  skyboxMaterial.backFaceCulling = false
  skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture('/textures/crate.jpg', scene)
  skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE
  skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0)
  skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0)
  skybox.material = skyboxMaterial
}

// 加载模型
function importModel (src) {
  return new Promise((resolve, reject) => {
    BABYLON.SceneLoader.ImportMeshAsync('', src, 'scene.gltf').then(res => {
      resolve(res)
    })
  })
}
// 模型交互事件
function setMeshActions (mesh) {
  mesh.actionManager = new BABYLON.ActionManager(scene)
  mesh.actionManager.registerAction(
    new BABYLON.ExecuteCodeAction(
      {
        trigger: BABYLON.ActionManager.OnPointerOverTrigger
      },
      function (e) {
        const dpic = scene.pick(scene.pointerX, scene.pointerY)
        hl.removeAllMeshes() // 清除其他高亮
        hl.addMesh(dpic.pickedMesh, BABYLON.Color3.Green())
      }
    )
  )
  mesh.actionManager.registerAction(
    new BABYLON.ExecuteCodeAction(
      {
        trigger: BABYLON.ActionManager.OnPickTrigger
      },
      function (e) {
        const dpic = scene.pick(scene.pointerX, scene.pointerY)
        pickedMesh = dpic.pickedMesh
        picker.text = pickedMesh.name
        picker.value = pickedMesh.material && (pickedMesh.material.albedoColor || pickedMesh.material.diffuseColor)
        hl.removeAllMeshes()
      }
    )
  )
}
// 初始化GUI
function initGUI () {
  const gui1 = GUI.AdvancedDynamicTexture.CreateFullscreenUI('myUI')
  const button = GUI.Button.CreateSimpleButton('button', '调色盘')
  button.top = -clientHeight / 2 + 60 + 'px'
  console.log(clientHeight)
  button.left = clientWidth / 2 - 100 + 'px'
  button.width = '150px'
  button.height = '50px'
  button.cornerRadius = 20
  button.thickness = 4
  button.children[0].color = '#DFF9FB'
  button.children[0].fontSize = 24
  button.color = '#FF7979'
  button.background = '#EB4D4B'
  button.onPointerClickObservable.add(async function () {
    panel.isVisible = !panel.isVisible
  })
  gui1.addControl(button)
  const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI', true, scene)
  panel = new GUI.StackPanel()
  panel.isVisible = false
  panel.width = '200px'
  panel.isVertical = true
  panel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT
  panel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER
  advancedTexture.addControl(panel)
  // 文本框
  const textBlock = new GUI.TextBlock()
  // textBlock.text = 'Diffuse color:'
  textBlock.height = '30px'
  panel.addControl(textBlock)
  // 颜色选择器
  picker = new GUI.ColorPicker()
  picker.height = '150px'
  picker.width = '150px'
  picker.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
  picker.onValueChangedObservable.add(function (value) { // value is a color3
    // console.log(pickedMesh.material)
    if (!pickedMesh) return
    if (pickedMesh.material.albedoColor) { pickedMesh.material.albedoColor.copyFrom(value) } else { pickedMesh.material.diffuseColor.copyFrom(value) }
  })
  panel.addControl(picker)
}
// 创建材质
function createMaterial () {
  const material = new BABYLON.StandardMaterial()
  // material.diffuseTexture = new BABYLON.Texture('/texture/crate.jpg')
  return material
}
// 切换材质
function changeMaterial (materialO) {
  const material = createMaterial()
  material.diffuseColor = materialO.albedoColor || materialO.diffuseColor
  return material
}
// 陀螺仪监听

function captureOrientation (event) {
  const alpha = event.alpha
  const beta = event.beta
  const gamma = event.gamma
  console.log('Orientation - Alpha: ' + alpha + ', Beta: ' + beta + ', Gamma: ' + gamma)
}
