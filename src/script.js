/*
    * @Descripttion:
    * @version:
    * @Author: XYK
    * @Date: 2021-09-09 14:42:56
 * @LastEditors: XYK
 * @LastEditTime: 2021-09-16 18:04:10
    */
import * as BABYLON from 'babylonjs'
import 'babylonjs-loaders'
import * as GUI from 'babylonjs-gui'
import * as dat from 'dat.gui'

let canvas, engine, scene, camera, light, pickedMesh, picker, model, hl, hlPicked, panel, meshes, combined, hemiLight
const options = {
  light: 'hemi',
  material: 'default',
  showColorPalette: false
}
init()

async function init () {
  canvas = document.querySelector('#renderCanvas')
  engine = new BABYLON.Engine(canvas, true, { stencil: true })
  console.log(engine)
  scene = new BABYLON.Scene(engine)
  // 相机
  camera = new BABYLON.ArcRotateCamera('Camera', Math.PI / 2, Math.PI / 2, 2000, new BABYLON.Vector3(0, 500, 0))
  camera.wheelDeltaPercentage = 0.01 // 滚轮速度
  camera.attachControl(canvas, true)
  camera.useAutoRotationBehavior = true // 自旋转
  camera.upperBetaLimit = Math.PI / 2.2 // 限制旋转
  // 光照
  // light = new BABYLON.PointLight('light', new BABYLON.Vector3(1280, 1750, 411), scene)
  hemiLight = new BABYLON.HemisphericLight('hemiLight', new BABYLON.Vector3(1, 1, 0))

  // 场景
  initField()

  engine.runRenderLoop(function () {
    scene.render()
  })
  // 监听浏览器resize事件
  window.addEventListener('resize', function () {
    engine.resize()
  })

  // 增加高亮渲染层.
  hl = new BABYLON.HighlightLayer('hl1', scene)
  hlPicked = new BABYLON.HighlightLayer('hl2', scene)
  engine.loadingUIText = '加载模型数据中，初次加载时间可能较长'
  engine.displayLoadingUI()
  // 模型
  model = await importModel('./models/sazabi_ver.ka/')
  engine.hideLoadingUI()
  meshes = model.meshes
  combined = BABYLON.Mesh.MergeMeshes(meshes)
  console.log(combined, meshes, model)
  // 初始化GUI
  initGUI()
  meshes.filter(mesh => mesh.material).forEach(mesh => {
    mesh.isPickable = true
    setMeshActions(mesh)
  })
}

// 绘制环境
function initField () {
  const ground = BABYLON.MeshBuilder.CreateGround('ground', { width: 1000, height: 1000 })
  ground.position = new BABYLON.Vector3(0, -80, 0)
  ground.material = new BABYLON.StandardMaterial()
  ground.material.diffuseColor = new BABYLON.Color3(0, 0, 0)
  const material = new BABYLON.StandardMaterial()
  material.diffuseTexture = new BABYLON.Texture('/texture/crate.jpg')
  ground.material = material
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
        // hl.removeAllMeshes() // 清除其他高亮
        // hl.addMesh(dpic.pickedMesh, BABYLON.Color3.Green())
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
        hlPicked.removeAllMeshes()
        hlPicked.addMesh(pickedMesh, BABYLON.Color3.Green())
      }
    )
  )
}
// 初始化GUI
function initGUI () {
  const gui = new dat.GUI()
  const lightFolder = gui.addFolder('光源')
  // lightFolder.add(light.position, 'x', -1750, 1750, 1)
  // lightFolder.add(light.position, 'y', -1750, 1750, 1)
  // lightFolder.add(light.position, 'z', -1750, 1750, 1)
  const optionsFolder = gui.addFolder('设置')
  const lightController = optionsFolder.add(options, 'light', { 环境光: 'hemi', 点光源: 'point' }).name('光源')
  lightController.onChange(value => {
    console.log(scene)
    scene.lights.pop()
  })
  const materialController = optionsFolder.add(options, 'material', { 消光: 'default', 珠光: 'standard' }).name('材质')
  materialController.onChange((value) => { changeMaterial() })

  const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI', true, scene)
  panel = new GUI.StackPanel()
  panel.isVisible = false
  optionsFolder.add(panel, 'isVisible').name('调色盘')
  panel.width = '200px'
  panel.isVertical = true
  panel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT
  panel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER
  advancedTexture.addControl(panel)
  // 文本框
  const textBlock = new GUI.TextBlock()
  textBlock.text = ''
  textBlock.height = '30px'
  panel.addControl(textBlock)
  // 颜色选择器
  picker = new GUI.ColorPicker()
  picker.height = '150px'
  picker.width = '150px'
  picker.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
  picker.onValueChangedObservable.add(function (value) {
    hlPicked.removeAllMeshes()
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
  meshes.filter(mesh => mesh.material).forEach(mesh => {
    const material = createMaterial()
    mesh.isPickable = true
    material.diffuseColor = mesh.material.albedoColor || mesh.materialO.diffuseColor
    mesh.material = material
  })
}

function getPermission () {
  console.log(window.DeviceOrientationEvent)
  window.addEventListener('deviceorientation', captureOrientation)
}

// 陀螺仪监听
function captureOrientation (event) {
  const alpha = event.alpha
  const beta = event.beta
  const gamma = event.gamma
  console.log('Orientation - Alpha: ' + alpha + ', Beta: ' + beta + ', Gamma: ' + gamma)
}
