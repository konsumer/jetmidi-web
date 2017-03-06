import QwertyHancock from 'qwerty-hancock'
import SimpleWebRTC from 'simplewebrtc'

import './style/index.scss'

window.AudioContext = window.AudioContext || window.webkitAudioContext
const context = new window.AudioContext()
const masterGain = context.createGain()
masterGain.gain.value = 0.3
masterGain.connect(context.destination)
const nodes = {}

const onSound = frequency => {
  const oscillator = context.createOscillator()
  oscillator.type = 'square'
  oscillator.frequency.value = frequency
  oscillator.connect(masterGain)
  oscillator.start(0)
  nodes[Math.round(frequency)] = oscillator
}

const offSound = frequency => {
  if (nodes[Math.round(frequency)]) {
    nodes[Math.round(frequency)].stop()
    delete nodes[Math.round(frequency)]
  }
}

const midiMessageReceived = ev => {
  var cmd = ev.data[0] >> 4
  // var channel = ev.data[0] & 0xf
  var noteNumber = ev.data[1]
  var velocity = 0
  if (ev.data.length > 2) {
    velocity = ev.data[2]
  }

  // MIDI noteon with velocity=0 is the same as noteoff
  if (cmd === 8 || ((cmd === 9) && (velocity === 0))) { // noteoff
    // noteOff(noteNumber)
  } else if (cmd === 9) { // note on
    // noteOn(noteNumber, velocity)
  } else if (cmd === 11) { // controller message
    // controller(noteNumber, velocity)
  }
}

navigator.requestMIDIAccess()
.then(midi => {
  for (var input of midi.inputs.values()) {
    input.onmidimessage = midiMessageReceived
  }
})

const webrtc = new SimpleWebRTC({
  localVideoEl: 'localVideo',
  remoteVideosEl: 'remotesVideos',
  autoRequestMedia: true
})

webrtc.on('readyToCall', function () {
  webrtc.joinRoom('jetmidi')
})

const settings = {
  id: 'keyboard',
  width: 800,
  height: 150,
  octaves: 4,
  startNote: 'C2',
  whiteNotesColour: 'white',
  blackNotesColour: 'black',
  whiteKeyColour: '#fff',
  blackKeyColour: '#000',
  theirActiveColour: 'green',
  hoverColour: '#f3e939'
}

const keyboard = new QwertyHancock(settings)

const handlers = {
  'key:up': (el, frequency) => {
    if (el !== null) {
      if (el.getAttribute('data-note-type') === 'white') {
        el.style.backgroundColor = settings.whiteKeyColour
      } else {
        el.style.backgroundColor = settings.blackKeyColour
      }
      offSound(frequency)
    }
  },
  'key:down': (el, frequency) => {
    if (el !== null || typeof el === undefined) {
      el.style.backgroundColor = settings.theirActiveColour
      if (document.getElementById('theirsound').checked) {
        onSound(frequency)
      }
    }
  }
}

keyboard.keyDown = function (note, frequency) {
  webrtc.sendDirectlyToAll('jetmidi', 'key:down', {note, frequency})
  if (document.getElementById('mysound').checked) {
    onSound(frequency)
  }
}

keyboard.keyUp = function (note, frequency) {
  webrtc.sendDirectlyToAll('jetmidi', 'key:up', {note, frequency})
  offSound(frequency)
}

webrtc.on('channelMessage', (peer, label, message) => {
  if (Object.keys(handlers).indexOf(message.type) !== -1) {
    handlers[message.type](document.getElementById(message.payload.note))
  }
})
