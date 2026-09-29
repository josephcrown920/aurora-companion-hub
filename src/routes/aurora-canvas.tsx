import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { upload } from "@vercel/blob/client";
import NexusDolaStudioScaffold from "../components/studio/NexusDolaStudioScaffold";
import "../aurora.css";
import bg1 from "../assets/aurora-bg-1.jpg";
import bg2 from "../assets/aurora-bg-2.jpg";
import bg3 from "../assets/aurora-bg-3.jpg";
import bg4 from "../assets/aurora-bg-4.jpg";
import bg5 from "../assets/aurora-bg-5.jpg";
import moonAsset from "../assets/aurora-moon.jpg.asset.json";
import chromeAsset from "../assets/aurora-chrome.jpg.asset.json";
import courtBg from "../assets/aurora-court.jpg";
import {
  CHAT_MODELS,
  DIRECTOR_MODELS,
  IMAGE_MODELS,
  VIDEO_MODELS,
  modelLabel,
  modelProvider,
  type ModelOption,
  type Provider,
} from "../lib/aurora-models";
import { SKILLS, buildSystemPrompt } from "../lib/aurora-skills";
import { primeSpeech, speak, stopSpeech } from "../lib/aurora-voice";
import { classifySeedanceReferenceError, isLasAssetReference } from "../lib/seedance-reference";
import { LayersEditor } from "../components/video/LayersEditor";

export const Route = createFileRoute("/aurora-canvas")({
  head: () => ({
    meta: [
      { title: "Aurora Creative Studio — AI Images & Videos in Seconds" },
      {
        name: "description",
        content:
          "Create AI images and videos in seconds. Seedream, Seedance and Seed models — turn any idea into stunning visuals, no design skills needed.",
      },
      { property: "og:title", content: "Aurora Creative Studio — AI Images & Videos" },
      {
        property: "og:description",
        content:
          "Seedream 5.0 images, Seedance 2.5 video and a creative director in chat. Turn any idea into stunning visuals.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

// existing code continues...
