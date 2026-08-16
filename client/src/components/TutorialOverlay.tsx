import { useCallback, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { driver, type DriveStep } from "driver.js";
import { useAppSelector } from "../store/store";
import "driver.js/dist/driver.css";

type TutorialName =
  | "home"
  | "quick-chat-visual"
  | "quick-chat"
  | "messages"
  | "inherit-branch";

const POLL_DELAY_MS = 500;
const RESTART_DELAY_MS = 300;

export default function TutorialOverlay() {
  const location = useLocation();
  const user = useAppSelector((state) => state.auth.user);
  const userEmail = user?.email || "anonymous";
  const localStorageKey = `seen_tutorials_${userEmail}`;

  const seenTutorials = useRef<Set<TutorialName>>(new Set());
  const runTutorialRef = useRef(false);
  const activeDriverRef = useRef<ReturnType<typeof driver> | null>(null);
  const routeKeyRef = useRef(location.pathname);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentPath = location.pathname;


  useEffect(() => {
    const stored = localStorage.getItem(localStorageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          seenTutorials.current = new Set(parsed as TutorialName[]);
        }
      } catch (e) {
        console.error("Error parsing stored tutorials", e);
      }
    } else {
      seenTutorials.current = new Set();
    }
  }, [localStorageKey]);

 
  useEffect(() => {
    routeKeyRef.current = currentPath;

    if (activeDriverRef.current) {
      activeDriverRef.current.destroy();
      activeDriverRef.current = null;
    }
    runTutorialRef.current = false;

    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  }, [currentPath]);

  const startTutorial = useCallback(
    (
      tutorialName: TutorialName,
      steps: DriveStep[],
      additionallySeen: TutorialName[] = [],
    ) => {
      if (runTutorialRef.current || activeDriverRef.current) {
        return false;
      }

      if (seenTutorials.current.has(tutorialName)) {
        return false;
      }

      seenTutorials.current.add(tutorialName);
      for (const name of additionallySeen) {
        seenTutorials.current.add(name);
      }

    
      localStorage.setItem(localStorageKey, JSON.stringify(Array.from(seenTutorials.current)));

      runTutorialRef.current = true;

      const driverInstance = driver({
        showProgress: true,
        animate: true,
        allowClose: true,
        overlayColor: "#000000",
        overlayOpacity: 0.6,
        stagePadding: 8,
        stageRadius: 12,
        popoverClass: "dendrites-driver-popover",
        steps: steps,
        onDestroyed: () => {
          runTutorialRef.current = false;
          activeDriverRef.current = null;

          if (restartTimerRef.current) {
            clearTimeout(restartTimerRef.current);
          }

          restartTimerRef.current = setTimeout(() => {
            restartTimerRef.current = null;
          }, RESTART_DELAY_MS);
        },
      });

      activeDriverRef.current = driverInstance;
      driverInstance.drive();
      return true;
    },
    [localStorageKey],
  );

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let observer: MutationObserver | null = null;

    const isCurrentRoute = () =>
      !cancelled && routeKeyRef.current === currentPath;

    const hasTarget = (selector: string) => {
      return Boolean(document.querySelector(selector));
    };

    const haveAllTargets = (selectors: string[]) => {
      return selectors.every((selector) => hasTarget(selector));
    };

    const homeSteps: DriveStep[] = [
      {
        popover: {
          title: "Welcome to Nurons! 👋",
          description:
            "Let's take a quick tour of how to organize your workspaces and chats.",
        },
      },
      {
        element: "#file-explorer-sidebar",
        popover: {
          title: "The Context Menu",
          description: `
            <p className="text-gray-700 text-base mb-3"><strong>Right-click or click the 3 dots</strong> anywhere in the sidebar to open the context menu.</p>
            <ul style="list-style-type: disc; padding-left: 1.25rem;" class="space-y-2 text-sm text-gray-600">
              <li><strong class="text-blue-600">New Chat:</strong> Create a standard AI conversation.</li>
              <li><strong class="text-blue-600">Agent Chat:</strong> Create an autonomous agent that can create folder structures for you.</li>
              <li><strong class="text-blue-600">New Folder:</strong> Create folders for perfect organization.</li>
              <li><strong class="text-blue-600">Move:</strong> Keep chats and workspaces organized.</li>
            </ul>
          `,
          side: "right",
          align: "center",
        },
      },
    ];

    const quickChatSteps: DriveStep[] = [
      {
        element: ".quick-chat-stick-btn",
        popover: {
          title: "Stick to Chat",
          description:
            "Click <strong>Stick to Chat</strong> to pin this quick deep-dive context into your main conversation.",
          side: "left",
          align: "center",
        },
      },
      {
        element: ".quick-chat-split-btn",
        popover: {
          title: "Split View",
          description:
            "Toggle between docking Quick Chat beside the conversation and displaying it as a draggable floating window.",
          side: "left",
          align: "center",
        },
      },
      {
        element: ".quick-chat-mode-btn",
        popover: {
          title: "Toggle Mode",
          description:
            "Switch between <strong>General</strong> text mode and <strong>Visual Mode</strong> for generating diagrams.",
          side: "top",
          align: "center",
        },
      },
    ];

    const quickChatVisualSteps: DriveStep[] = [
      {
        element: ".quick-chat-stick-btn",
        popover: {
          title: "Stick to Chat",
          description:
            "Click <strong>Stick to Chat</strong> to save this Quick Chat in your main conversation.",
          side: "left",
          align: "center",
        },
      },
      {
        element: ".quick-chat-split-btn",
        popover: {
          title: "Split View",
          description:
            "Switch between a docked Quick Chat and a draggable floating window.",
          side: "left",
          align: "center",
        },
      },
      {
        element: ".quick-chat-visual-btn",
        popover: {
          title: "Visual Mode",
          description:
            "Toggle <strong>Background Blur</strong> to control how much of the main chat is visible behind the floating window.",
          side: "left",
          align: "center",
        },
      },
      {
        element: ".quick-chat-mode-btn",
        popover: {
          title: "Toggle Mode",
          description:
            "Switch between <strong>General</strong> and <strong>Visual Mode</strong>.",
          side: "top",
          align: "center",
        },
      },
    ];

    const messagesSteps: DriveStep[] = [
      {
        element: ".tutorial-ai-message",
        popover: {
          title: "Quick Chat & Recall",
          description:
            "<strong>Highlight any text</strong> in an AI response to open a Quick Chat side panel to deep dive inside, or save the selection as a Recall Card.",
          side: "right",
          align: "center",
        },
      },
      {
        element: "#tutorial-recall-btn",
        popover: {
          title: "Recall Cards",
          description:
            "Hover over a message and click the <strong>Brain icon</strong> to save it as a flashcard.",
          side: "right",
          align: "center",
        },
      },
    ];

    const inheritBranchSteps: DriveStep[] = [
      {
        element: "#inherit-branch-button",
        popover: {
          title: "Inherit Branch",
          description:
            "Click here to <strong>inherit context</strong> from a previous chat.",
          side: "top",
          align: "center",
        },
      },
    ];

    const tryStartNextTutorial = () => {
      const visualQuickChatReady =
        haveAllTargets([
          ".quick-chat-stick-btn",
          ".quick-chat-split-btn",
          ".quick-chat-visual-btn",
          ".quick-chat-mode-btn",
        ]) && !seenTutorials.current.has("quick-chat-visual");

      const normalQuickChatReady =
        haveAllTargets([
          ".quick-chat-stick-btn",
          ".quick-chat-split-btn",
          ".quick-chat-mode-btn",
        ]) && !seenTutorials.current.has("quick-chat");

      const messagesReady =
        haveAllTargets([".tutorial-ai-message", "#tutorial-recall-btn"]) &&
        !seenTutorials.current.has("messages");

      const inheritBranchReady =
        hasTarget("#inherit-branch-button") &&
        !seenTutorials.current.has("inherit-branch");

      if (
        !isCurrentRoute() ||
        runTutorialRef.current ||
        activeDriverRef.current
      ) {
        return;
      }

      if (currentPath === "/") {
        const homeTargetExists = haveAllTargets([
          "body",
          "#file-explorer-sidebar",
        ]);

        if (homeTargetExists && !seenTutorials.current.has("home")) {
          startTutorial("home", homeSteps);
        }
        return;
      }

      if (visualQuickChatReady) {
        startTutorial("quick-chat-visual", quickChatVisualSteps, [
          "quick-chat",
        ]);
        return;
      }

      if (normalQuickChatReady) {
        startTutorial("quick-chat", quickChatSteps);
        return;
      }

      if (messagesReady) {
        startTutorial("messages", messagesSteps);
        return;
      }

      if (inheritBranchReady) {
        startTutorial("inherit-branch", inheritBranchSteps);
      }
    };

    const scheduleNextCheck = () => {
      if (cancelled) return;

      timeoutId = setTimeout(() => {
        tryStartNextTutorial();
        scheduleNextCheck();
      }, POLL_DELAY_MS);
    };

    observer = new MutationObserver(() => {
      tryStartNextTutorial();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    tryStartNextTutorial();
    scheduleNextCheck();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      observer?.disconnect();
    };
  }, [currentPath, startTutorial]);

  useEffect(() => {
    return () => {
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
      }
      if (activeDriverRef.current) {
        activeDriverRef.current.destroy();
        activeDriverRef.current = null;
      }
    };
  }, []);

  return null;
}
