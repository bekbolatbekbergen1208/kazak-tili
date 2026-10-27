"""Generate the fixed authored lesson batch with Edge TTS, without Azure credentials.
Usage: python scripts/generate-listening-edge.py /path/to/listening-plan.json
Dependencies: edge-tts==7.3.1 imageio-ffmpeg==0.6.0
Export the plan with: node --import tsx scripts/listening-plan.ts > /tmp/listening-plan.json
"""
import asyncio
import hashlib
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path
import edge_tts
import imageio_ffmpeg

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public/audio/listening"

async def main():
    plan = json.loads(Path(sys.argv[1]).read_text())
    if len(plan) > 60 or sum(len(t['text']) for l in plan for t in l['turns']) > 15000:
        raise ValueError("Fixed pilot batch limit exceeded")
    available = {v['ShortName'] for v in await asyncio.wait_for(edge_tts.list_voices(), 30)}
    required = {'kk-KZ-AigulNeural', 'kk-KZ-DauletNeural'}
    if not required <= available:
        raise ValueError("Both Kazakh voices are not available")
    print("Айгүл + Дәулет: екі дауыс та қолжетімді", flush=True)
    OUT.mkdir(parents=True, exist_ok=True)
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    for lesson in plan:
        if not re.fullmatch(r'[a-z0-9-]+', lesson['id']) or not re.fullmatch(r'[a-f0-9]{16}', lesson['hash']):
            raise ValueError("Invalid asset name")
        stem = f"{lesson['id']}-{lesson['hash']}"
        target, meta = OUT / f"{stem}.mp3", OUT / f"{stem}.json"
        if target.exists() and meta.exists():
            print(f"{lesson['id']}: already generated, preserving", flush=True)
            continue
        with tempfile.TemporaryDirectory(prefix='qazaqdos-tts-') as tmp:
            tmp = Path(tmp)
            parts = []
            for i, turn in enumerate(lesson['turns']):
                if turn['voice'] not in required:
                    raise ValueError("Voice outside fixed allowlist")
                part = tmp / f"turn-{i}.mp3"
                await asyncio.sleep(3.2)
                await asyncio.wait_for(edge_tts.Communicate(turn['text'], turn['voice'], rate='-10%').save(str(part)), 60)
                if part.stat().st_size < 1000:
                    raise ValueError("Empty synthesis")
                parts.append(part)
            silence = tmp / 'silence.mp3'
            subprocess.run([ffmpeg, '-v', 'error', '-f', 'lavfi', '-i', 'anullsrc=r=24000:cl=mono', '-t', '0.6', '-c:a', 'libmp3lame', str(silence)], check=True)
            files = []
            for i, part in enumerate(parts):
                files.append(f"file '{part}'")
                if i < len(parts)-1:
                    files.append(f"file '{silence}'")
            concat = tmp / 'concat.txt'
            concat.write_text('\n'.join(files))
            audio = tmp / 'complete.mp3'
            subprocess.run([ffmpeg, '-v', 'error', '-f', 'concat', '-safe', '0', '-i', str(concat), '-ar', '24000', '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '96k', str(audio)], check=True)
            # Decode the whole MP3: reject broken/truncated streams before publishing locally.
            subprocess.run([ffmpeg, '-v', 'error', '-xerror', '-i', str(audio), '-f', 'null', '-'], check=True)
            payload = audio.read_bytes()
            target.write_bytes(payload)
            meta.write_text(json.dumps({'provider': 'edge-tts', 'sourceHash': lesson['hash'], 'voices': sorted({t['voice'] for t in lesson['turns']}), 'sha256': hashlib.sha256(payload).hexdigest(), 'bytes': len(payload)}, indent=2)+'\n')
            print(f"{lesson['id']}: saved {len(payload)} bytes", flush=True)

if __name__ == '__main__':
    asyncio.run(main())
