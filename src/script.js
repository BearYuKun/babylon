/*
    * @Descripttion:
    * @version:
    * @Author: XYK
    * @Date: 2021-09-09 14:42:56
 * @LastEditors: XYK
 * @LastEditTime: 2021-09-18 17:57:07
    */
import * as BABYLON from 'babylonjs'
import 'babylonjs-loaders'
import * as GUI from 'babylonjs-gui'
import * as dat from 'dat.gui'
import * as Materials from 'babylonjs-materials'

let canvas, engine, scene, camera, light, pickedMesh, picker, model, hl, hlPicked, panel, meshes, combined, hemiLight, skySphere, defaultMaterial, ground, lightImpostor, lightImpostorMat
const options = {
  light: 'hemi',
  material: 'SimpleMaterial',
  skyMaterial: 'Default',
  arms: true
}
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
  // camera.upperBetaLimit = Math.PI / 2.2 // 限制旋转
  camera.lowerRadiusLimit = 5
  camera.upperRadiusLimit = 2500
  camera.maxZ = 10000

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
  defaultMaterial = model.meshes.find(mesh => mesh.material).material
  console.log(defaultMaterial)

  engine.hideLoadingUI()
  meshes = model.meshes
  initField()
  initSkyBox()
  // 光照
  initLight()

  // 初始化GUI
  initGUI()
  meshes.forEach(mesh => {
    mesh.isPickable = true
    mesh.position.y -= 40
    setMeshActions(mesh)
  })
  changeMaterial('SimpleMaterial')
}
function initLight () {
  // 光照
  light = new BABYLON.PointLight('light', new BABYLON.Vector3(1280, 1750, 411), scene)
  lightImpostor = BABYLON.Mesh.CreateSphere('sphere1', 16, 100, scene)
  lightImpostorMat = new BABYLON.StandardMaterial('mat', scene)
  lightImpostor.material = lightImpostorMat
  lightImpostorMat.emissiveColor = BABYLON.Color3.Yellow()
  lightImpostorMat.linkEmissiveWithDiffuse = true
  lightImpostor.parent = light
  hemiLight = new BABYLON.HemisphericLight('hemiLight', new BABYLON.Vector3(0, 1, 0))
  hemiLight.intensity = 0
  initShadow()
}
function initShadow () {
  const shadowGenerator = new BABYLON.ShadowGenerator(1024, light)
  shadowGenerator.getShadowMap().renderList.concat(meshes)
  shadowGenerator.setDarkness(0.5)
  shadowGenerator.usePoissonSampling = true
  shadowGenerator.bias = 0
  shadowGenerator.addShadowCaster(meshes[0])
  skySphere.receiveShadows = true
  ground.receiveShadows = true
}
function initField () {
  ground = BABYLON.Mesh.CreateGround('ground', 5000, 5000)
  ground.position.y -= 100
}

// 天空盒
function initSkyBox () {
  skySphere = BABYLON.Mesh.CreateSphere('skySphere', 30, 6000, scene)
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
        scene.pick(scene.pointerX, scene.pointerY)
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
        console.log(dpic.pickedMesh.id)
        pickedMesh = dpic.pickedMesh
        picker.text = pickedMesh.name
        picker.value = pickedMesh.material && (pickedMesh.material.albedoColor || pickedMesh.material.diffuseColor || pickedMesh.lineColor)
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
  lightFolder.add(light.position, 'x', -1750, 1750, 1)
  lightFolder.add(light.position, 'y', -1750, 1750, 1)
  lightFolder.add(light.position, 'z', -1750, 1750, 1)
  lightFolder.add(light, 'intensity', 0, 3).name('点光源强度')
  lightFolder.add(hemiLight, 'intensity', 0, 3).name('环境光强度')
  const optionsFolder = gui.addFolder('设置')

  const materials = ['NormalMaterial', 'GridMaterial', 'SimpleMaterial', 'CellMaterial', 'StandardMaterial', 'SkyMaterial']
  const skyMaterials = ['Default', 'NormalMaterial', 'GridMaterial', 'SimpleMaterial', 'CellMaterial', 'StandardMaterial', 'SkyMaterial']

  optionsFolder.add(options, 'material', materials).onChange((value) => { changeMaterial(value) }).name('材质')
  optionsFolder.add(options, 'skyMaterial', skyMaterials).onChange((value) => { changeSkyMaterial(value) }).name('天空')

  optionsFolder.add(options, 'arms').name('外甲').onChange((value) => {
    const armsId = [9, 6, 34, 10, 11, 35, 36, 37, 38, 39]
    meshes.forEach(mesh => {
      const id = Number(mesh.id.split('e')[1])
      if (armsId.includes(id)) {
        mesh.visibility = options.arms
      }
    })
  })
  optionsFolder.add(camera, 'useAutoRotationBehavior').name('相机自旋转')
  const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI', true, scene)
  panel = new GUI.StackPanel()
  panel.isVisible = true
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
function createMaterial (materialO) {
  let material = ''
  if (Materials[materialO]) { material = new Materials[materialO]() } else material = new BABYLON[materialO]()
  switch (materialO) {
    case 'GridMaterial': {
      material.majorUnitFrequency = 6
      material.minorUnitVisibility = 0.43
      material.gridRatio = 20
      break
    }
  }
  material.backFaceCulling = false
  return material
}
// 切换材质
function changeMaterial (materialO) {
  meshes.filter(mesh => mesh.material).forEach(mesh => {
    let material = ''
    if (materialO === 'Default') {
      material = defaultMaterial
    } else {
      material = createMaterial(materialO)
    }
    mesh.isPickable = true
    material.lineColor = material.diffuseColor = material.albedoColor = mesh.material.albedoColor || mesh.material.diffuseColor || pickedMesh.material.lineColor
    mesh.material = material
  })
}

// 切换天空材质
function changeSkyMaterial (materialO) {
  if (materialO === 'Default') {
    skySphere.isVisible = false
    return
  }
  skySphere.isVisible = true
  const material = createMaterial(materialO)
  skySphere.material = material
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
