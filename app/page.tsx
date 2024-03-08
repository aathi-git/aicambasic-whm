"use client"
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { useRef } from "react";
import Webcam from "react-webcam";
import * as cocossd from '@tensorflow-models/coco-ssd'
import "@tensorflow/tfjs-backend-cpu"
import "@tensorflow/tfjs-backend-webgl"
import { Fira_Sans_Extra_Condensed } from "next/font/google";
import { init } from "next/dist/compiled/webpack/webpack";
import { DetectedObject, ObjectDetection } from "@tensorflow-models/coco-ssd";
import { setLazyProp } from "next/dist/server/api-utils";
import { drawOnCanvas } from "@/utils/draw";

type Props = {}

let interval: any = null;
const HomePage = (props: Props) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const [mirrored,setMirrored] = useState<boolean>(false);
  const [model, setModel] = useState<ObjectDetection>();
  const [loading, SetLoading] = useState(true);
  const [cameraSource, setCameraSource] = useState<"user" | "environment">("user");
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [ipAddress, setIpAddress] = useState<string | null>(null);

  const toggleCameraSource = () => {
    setCameraSource((prevSource) => (prevSource === "user" ? "environment" : "user"));
  };
  



  useEffect(() => {
    SetLoading(true);
    initModel();

  }, [])

  async function initModel() {
    const loadedModel: ObjectDetection = await cocossd.load({
      base: 'lite_mobilenet_v2'
    });
    setModel(loadedModel);
    SetLoading(false);
  }

  useEffect(() => {
    if(model){
      SetLoading(false);
    }
  }, [model])


  async function runPredication() {
    if (
      model &&
      webcamRef.current &&
      webcamRef.current.video &&
      webcamRef.current.video.readyState === 4
    ) {
      const predictions: DetectedObject[] = await model.detect(webcamRef.current.video);

      resizeCanvas(canvasRef, webcamRef);
      drawOnCanvas(mirrored, predictions, canvasRef.current?.getContext('2d'));

      // Log detected objects
      logObjects(predictions);
    }
  }

  useEffect(() => {
    interval = setInterval(() => {
        runPredication();
    },100)

    return ()=> clearInterval(interval);
  }, [webcamRef.current, model])


  const logObjects = (predictions: DetectedObject[]) => {
    if (logRef.current) {
      const logText = predictions.map((obj) => {
        return `Object: ${obj.class}, Confidence: ${Math.floor(obj.score * 100)}%`;
      });

      logRef.current.innerHTML = logText.join('<br>') + '<br>';
    }
  };

  useEffect(() => {
    const getBatteryInfo = () => {
      if ('getBattery' in navigator) {
        (navigator as any).getBattery().then((battery: { level: number }) => {
          setBatteryLevel(battery.level * 100);
        });
      }
    };
  
    getBatteryInfo();
  
    const batteryEventListener = () => {
      if ('getBattery' in navigator) {
        (navigator as any).getBattery().then((battery: { level: number }) => {
          setBatteryLevel(battery.level * 100);
        });
      }
    };
  
  
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: { addEventListener: (arg0: string, arg1: () => void) => void }) => {
        battery.addEventListener("levelchange", batteryEventListener);
      });
    }

    return () => {
      if ('getBattery' in navigator) {
        (navigator as any).getBattery().then((battery: { removeEventListener: (arg0: string, arg1: () => void) => void }) => {
          battery.removeEventListener("levelchange", batteryEventListener);
        });
      }
    };
  }, []);

  useEffect(() => {
    const getIpAddress = async () => {
      const response = await fetch("https://api64.ipify.org?format=json");
      const data = await response.json();
      setIpAddress(data.ip);
    };

    getIpAddress();
  }, []);




  return (
    <div className="flex h-screen bg-black text-white">
      {loading && <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">Loading, please wait...</div>}
      {!loading && (
        <>
          <div className="absolute top-4 left-4">
            <div className="text-2xl font-bold">WHM</div>
            <div>Battery: {batteryLevel}%</div>
            <div>IP: {ipAddress}</div>
          </div>
          <Webcam
            ref={webcamRef}
            mirrored={mirrored}
            className="h-full w-full object-cover"
            videoConstraints={{ facingMode: cameraSource }}
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 h-full w-full object-contain"
          ></canvas>
          <button onClick={toggleCameraSource} className="absolute top-4 right-4 bg-red-500 p-2 rounded-md">
            Switch Camera
          </button>
          <div ref={logRef} className="absolute bottom-4 left-4 max-h-1/2 overflow-y-auto">
            {/* Log Area */}
          </div>
          <a
            href="http://www.bit.ly/whminfo"
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-4 right-4 text-blue-500 underline hover:text-blue-700"
          >
            Visit-WHM
          </a>
        </>
      )}
  
     
    </div>
  );
  
}  





export default HomePage

function resizeCanvas(canvasRef: React.RefObject<HTMLCanvasElement>, webcamRef: React.RefObject<Webcam>) {
  const canvas = canvasRef.current;
  const video = webcamRef.current?.video;

  if ((canvas && video)) {
    const { videoWidth, videoHeight } = video;
    canvas.width = videoWidth;
    canvas.height = videoHeight;

  }
}
