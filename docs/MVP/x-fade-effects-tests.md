# X-Fade Effects Test Plan

This document outlines the x-fade transition effects to be tested using the Rendi API. The tests will focus on merging two videos (Video 2 and Video 3 from `tests/e2e/test-xfade.js`) with each available x-fade transition type.

## Available X-Fade Transitions
https://trac.ffmpeg.org/wiki/Xfade

The following x-fade transition effects are available based on the FFmpeg documentation and Rendi API capabilities:

| ID | Transition Name | Description | Test Result | Video URL |
|---|---|---|---|---|
| 1 | fade | Simple fade transition | SUCCESS | https://storage.rendi.dev/trial_files/0808e41b-6373-4dfe-86ca-a33a34165828/7f8ee451-0469-49bc-8e0e-59fde97f21d4/merged.mp4 |
| 2 | wipeleft | Wipe from right to left | SUCCESS | https://storage.rendi.dev/trial_files/0808e41b-6373-4dfe-86ca-a33a34165828/9ff0e24a-a412-4d28-8627-ebbb10537688/merged.mp4 |
| 3 | wiperight | Wipe from left to right | SUCCESS | https://storage.rendi.dev/trial_files/0808e41b-6373-4dfe-86ca-a33a34165828/bcfae7b1-ded2-4fcd-9b59-277b06796db2/merged.mp4 |
| 4 | wipeup | Wipe from bottom to top | SUCCESS | https://storage.rendi.dev/trial_files/0808e41b-6373-4dfe-86ca-a33a34165828/41943183-5578-47aa-858c-00c0cbad2bdf/merged.mp4 |
| 5 | wipedown | Wipe from top to bottom | SUCCESS | https://storage.rendi.dev/trial_files/0808e41b-6373-4dfe-86ca-a33a34165828/9941cd58-89ad-40b8-a757-3a2ebb75949e/merged.mp4 |
| 6 | slideleft | Slide from right to left | SUCCESS | https://storage.rendi.dev/trial_files/0808e41b-6373-4dfe-86ca-a33a34165828/40d5ed57-e5f1-4b29-9eeb-c5d78174f43e/merged.mp4 |
| 7 | slideright | Slide from left to right | SUCCESS | https://storage.rendi.dev/trial_files/0808e41b-6373-4dfe-86ca-a33a34165828/0606ff9c-66b7-4acc-90bf-1cb8658e45a1/merged.mp4 |
| 8 | slideup | Slide from bottom to top | SUCCESS | https://storage.rendi.dev/trial_files/0808e41b-6373-4dfe-86ca-a33a34165828/7f70106c-9fe0-4aee-bc5e-e728e68e7d98/merged.mp4 |
| 9 | slidedown | Slide from top to bottom | SUCCESS | https://storage.rendi.dev/trial_files/0808e41b-6373-4dfe-86ca-a33a34165828/50294f95-e056-4bf9-be13-7c023c8b3076/merged.mp4 |
| 10 | circlecrop | Circular crop transition | SUCCESS | https://storage.rendi.dev/trial_files/0808e41b-6373-4dfe-86ca-a33a34165828/48250a73-1d0f-49ce-9102-7b539cf105db/merged.mp4 |
| 11 | rectcrop | Rectangular crop transition | SUCCESS | https://storage.rendi.dev/trial_files/0808e41b-6373-4dfe-86ca-a33a34165828/4cce1632-634d-434d-963d-77029ac508cd/merged.mp4 |
| 12 | distance | Transition based on distance metric | SUCCESS | https://storage.rendi.dev/trial_files/0808e41b-6373-4dfe-86ca-a33a34165828/82c444cd-0f61-4d64-bc1f-294c09b9a6fe/merged.mp4 |
| 13 | fadeblack | Fade to black | SUCCESS | https://storage.rendi.dev/trial_files/0808e41b-6373-4dfe-86ca-a33a34165828/a3133cb7-741e-42f4-85f2-9664b3f1b107/merged.mp4 |
| 14 | fadewhite | Fade to white | SUCCESS | https://storage.rendi.dev/trial_files/0808e41b-6373-4dfe-86ca-a33a34165828/0bae6559-705b-438d-9912-c5dca74b8bd4/merged.mp4 |
| 15 | radial | Radial transition | SUCCESS | https://storage.rendi.dev/trial_files/0808e41b-6373-4dfe-86ca-a33a34165828/40683b88-ab37-4303-a030-f75120c41551/merged.mp4 |
| 16 | smoothleft | Smooth slide from right to left | SUCCESS | https://storage.rendi.dev/trial_files/0808e41b-6373-4dfe-86ca-a33a34165828/07a21f0e-d3c1-47e3-8723-ad751b3a6d93/merged.mp4 |
| 17 | smoothright | Smooth slide from left to right | SUCCESS | https://storage.rendi.dev/trial_files/0808e41b-6373-4dfe-86ca-a33a34165828/4bfab86b-c8f3-4ba9-8a51-b988d834425d/merged.mp4 |
| 18 | smoothup | Smooth slide from bottom to top | SUCCESS | https://storage.rendi.dev/trial_files/0808e41b-6373-4dfe-86ca-a33a34165828/ada60e44-81aa-4bef-9eef-84ddcc31c9a3/merged.mp4 |
| 19 | smoothdown | Smooth slide from top to bottom | SUCCESS | https://storage.rendi.dev/trial_files/0808e41b-6373-4dfe-86ca-a33a34165828/8f8b6b21-315d-4a86-a552-94f56052f789/merged.mp4 |
| 20 | circleopen | Circular opening transition | SUCCESS | https://storage.rendi.dev/trial_files/0808e41b-6373-4dfe-86ca-a33a34165828/adfdfdb7-1389-4bfa-8a6c-4dd24ac78e63/merged.mp4 |
| 21 | circleclose | Circular closing transition | SUCCESS | https://storage.rendi.dev/trial_files/0808e41b-6373-4dfe-86ca-a33a34165828/4ceb9eb7-31f2-4f3f-9275-26eb7381464b/merged.mp4 |
| 22 | vertopen | Vertical opening transition | SUCCESS | https://storage.rendi.dev/trial_files/0808e41b-6373-4dfe-86ca-a33a34165828/5fe4f917-889b-4918-b59d-5e6d0061eb5a/merged.mp4 |
| 23 | vertclose | Vertical closing transition | SUCCESS | https://storage.rendi.dev/trial_files/0808e41b-6373-4dfe-86ca-a33a34165828/bc97e243-bc8d-4d93-9f69-922802a2c41f/merged.mp4 |
| 24 | horzopen | Horizontal opening transition | SUCCESS | https://storage.rendi.dev/trial_files/0808e41b-6373-4dfe-86ca-a33a34165828/53062f62-d1e8-48f1-8f3e-03829e0f2d52/merged.mp4 |
| 25 | horzclose | Horizontal closing transition | SUCCESS | https://storage.rendi.dev/trial_files/0808e41b-6373-4dfe-86ca-a33a34165828/cc67706f-fbe2-45b4-9a08-80073e6d14e2/merged.mp4 |
| 26 | dissolve | Dissolve transition | SUCCESS | https://storage.rendi.dev/trial_files/0808e41b-6373-4dfe-86ca-a33a34165828/8cc140c7-51fe-44ef-98e4-a5839a0941cb/merged.mp4 |
| 27 | pixelize | Pixelation effect during transition | SUCCESS | https://storage.rendi.dev/trial_files/0808e41b-6373-4dfe-86ca-a33a34165828/5625a29a-65d1-4c2c-b575-9282380f73d7/merged.mp4 |
| 28 | diagtl | Diagonal wipe from top-left to bottom-right | SUCCESS | https://storage.rendi.dev/trial_files/0808e41b-6373-4dfe-86ca-a33a34165828/056ac427-abea-40e4-88af-189c2f36b3dd/merged.mp4 |
| 29 | diagtr | Diagonal wipe from top-right to bottom-left | SUCCESS | https://storage.rendi.dev/trial_files/0808e41b-6373-4dfe-86ca-a33a34165828/5d1e1d6a-169d-4442-894f-e1f9c5211d56/merged.mp4 |
| 30 | diagbl | Diagonal wipe from bottom-left to top-right | SUCCESS | https://storage.rendi.dev/trial_files/0808e41b-6373-4dfe-86ca-a33a34165828/09271ed1-4536-414b-836d-6e5ba622d080/merged.mp4 |
| 31 | diagbr | Diagonal wipe from bottom-right to top-left | SUCCESS | https://storage.rendi.dev/trial_files/0808e41b-6373-4dfe-86ca-a33a34165828/819a15d6-1e68-43d3-aaa8-c324aa1aaa35/merged.mp4 |
| 32 | hlslice | Horizontal line slice transition | SUCCESS | https://storage.rendi.dev/trial_files/0808e41b-6373-4dfe-86ca-a33a34165828/48c29a14-8844-449a-af2f-1509fa3b9fce/merged.mp4 |
| 33 | hrslice | Horizontal row slice transition | SUCCESS | https://storage.rendi.dev/trial_files/0808e41b-6373-4dfe-86ca-a33a34165828/0e71559e-a094-4381-9fcf-5cb099467cea/merged.mp4 |
| 34 | vuslice | Vertical up slice transition | SUCCESS | https://storage.rendi.dev/trial_files/0808e41b-6373-4dfe-86ca-a33a34165828/a88394e1-907d-49cc-89fb-87401b7075df/merged.mp4 |
| 35 | vdslice | Vertical down slice transition | SUCCESS | https://storage.rendi.dev/trial_files/0808e41b-6373-4dfe-86ca-a33a34165828/5bbfa1b0-d92e-4a3f-8695-0735a3148e5d/merged.mp4 |
| 36 | hblur | Horizontal blur transition | SUCCESS | https://storage.rendi.dev/trial_files/0808e41b-6373-4dfe-86ca-a33a34165828/368746a1-6c05-4cae-af4e-c8e9f1dd65fa/merged.mp4 |
| 37 | fadegrays | Fade to grayscale | SUCCESS | https://storage.rendi.dev/trial_files/0808e41b-6373-4dfe-86ca-a33a34165828/f9b10431-3ae4-447d-9daa-024aafaf2029/merged.mp4 |
| 38 | wipetl | Wipe from top-left corner | SUCCESS | https://storage.rendi.dev/trial_files/0808e41b-6373-4dfe-86ca-a33a34165828/a1b2eee4-932e-4c5d-885b-92073eaf6221/merged.mp4 |
| 39 | wipetr | Wipe from top-right corner | SUCCESS | https://storage.rendi.dev/trial_files/0808e41b-6373-4dfe-86ca-a33a34165828/b24b779c-ecb2-4294-9642-f2b7021ee42b/merged.mp4 |
| 40 | wipebl | Wipe from bottom-left corner | SUCCESS | https://storage.rendi.dev/trial_files/0808e41b-6373-4dfe-86ca-a33a34165828/7d733452-39e5-44d7-8b7e-c3c190441881/merged.mp4 |
| 41 | wipebr | Wipe from bottom-right corner | SUCCESS | https://storage.rendi.dev/trial_files/0808e41b-6373-4dfe-86ca-a33a34165828/d2488cbe-5eaf-41a3-8af3-724a9757d2dd/merged.mp4 |
| 42 | squeezeh | Horizontal squeeze transition | SUCCESS | https://storage.rendi.dev/trial_files/0808e41b-6373-4dfe-86ca-a33a34165828/f3a886b7-a040-4747-b0d5-de7cf558b1ae/merged.mp4 |
| 43 | squeezev | Vertical squeeze transition | SUCCESS | https://storage.rendi.dev/trial_files/0808e41b-6373-4dfe-86ca-a33a34165828/ac1414da-65d7-4150-96d9-0bf1dbeedfcb/merged.mp4 |
| 44 | zoomin | Zoom in transition | SUCCESS | https://storage.rendi.dev/trial_files/0808e41b-6373-4dfe-86ca-a33a34165828/183f51ed-8fe3-4e5f-99d8-c37fba77d9f4/merged.mp4 |
| 45 | fadefast | Fast fade transition | SUCCESS | https://storage.rendi.dev/trial_files/0808e41b-6373-4dfe-86ca-a33a34165828/e953c19b-7703-4af6-af81-8744a1b2e06a/merged.mp4 |
| 46 | fadeslow | Slow fade transition | SUCCESS | https://storage.rendi.dev/trial_files/0808e41b-6373-4dfe-86ca-a33a34165828/76d870c4-fe27-41ac-b778-b4a1e3a204c7/merged.mp4 |
| 47 | hlwind | Horizontal left wind transition | FAILED | Error: Unable to parse option value "hlwind" for xfade transition. Invalid argument. |
| 48 | hrwind | Horizontal right wind transition | FAILED | Error: Invalid argument 'hrwind' for xfade filter. |
| 49 | vuwind | Vertical up wind transition | FAILED | Error: Invalid argument 'vuwind' for xfade filter. |
| 50 | vdwind | Vertical down wind transition | FAILED | Error: Invalid argument 'vdwind' for xfade filter. |
| 51 | coverleft | Cover from left transition | FAILED | Error: Invalid argument 'coverleft' for xfade filter. |
| 52 | coverright | Cover from right transition | FAILED | Error: Invalid argument 'coverright' for xfade filter. |
| 53 | coverup | Cover from top transition | FAILED | Error: Invalid argument 'coverup' for xfade filter. |
| 54 | coverdown | Cover from bottom transition | FAILED | Error: Invalid argument 'coverdown' for xfade filter. |
| 55 | revealleft | Reveal from left transition | FAILED | Error: Invalid argument 'revealleft' for xfade filter. |
| 56 | revealright | Reveal from right transition | FAILED | Error: Invalid argument 'revealright' for xfade filter. |
| 57 | revealup | Reveal from top transition | FAILED | Error: Invalid argument 'revealup' for xfade filter. |
| 58 | revealdown | Reveal from bottom transition | FAILED | Error: Invalid argument 'revealdown' for xfade filter. |

---

## 🧪 Running the Test Scripts

### Prerequisites

1.  **RENDI_API_KEY** in `.env.local`
2.  **Video URLs** from Convex storage (Scene 2 and Scene 3 are used in the test scripts)

### Running a Specific Test

To run a test script for a specific x-fade effect, navigate to the project root and execute the corresponding script:

```bash
cd /home/laurentperello/myshortreel-alpha
node tests/x-fade-effects-scripts/[ID]-[transition-name].js
```

**Example**: To run the test for the `fade` transition (ID 1):

```bash
node tests/x-fade-effects-scripts/1-fade.js
```

### Expected Output

Upon successful submission and processing by the Rendi API, the script will output the video URL:

```
🔑 API Key loaded (first 20 chars): eJwzsDCwSDUxTfNI...
🧪 Starting XFADE PoC with Rendi API...
   Transition type: 'fade'
   Clip duration: 10s
   Transition duration: 1s
   Scenes: 2

   Offset 1: 9s

📝 Generated FFmpeg Command:
   -i {{in_scene1}} -i {{in_scene2}} -filter_complex "...

🚀 Submitting to Rendi API...
✅ Job Submitted! ID: [COMMAND_ID]
⏳ Polling for result...

   Processing...

✅ SUCCESS! (took XX.Xs)
📹 Here is your video:
https://storage.rendi.dev/.../merged.mp4
```

---

## ✅ How to Verify the Output and Get the Video URL

### Method 1: Check via Script Output (Recommended)

The script prints the generated video URL upon success. Simply click the URL in your terminal to watch the video.

### Method 2: Manual API Poll

If the script was interrupted or you need to check the status manually, you can poll the Rendi API using the `command_id` obtained from the script's output:

```bash
curl -s -H "X-API-KEY: YOUR_RENDI_API_KEY" \
  "https://api.rendi.dev/v1/commands/YOUR_COMMAND_ID"
```

**Look for**:
-   `"status": "SUCCESS"` - Indicates the job completed successfully.
-   `"storage_url"` - The URL to download or watch the generated video.

### Method 3: List Recent Commands

You can also list your recent Rendi commands to find the status and output URL:

```bash
curl -s -H "X-API-KEY: YOUR_RENDI_API_KEY" \
  "https://api.rendi.dev/v1/commands?limit=5"
```

