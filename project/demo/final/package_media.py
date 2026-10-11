"""Package the prepared individual A3 recordings and exact narration text."""
import hashlib
import json
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[3]
MEDIA = ROOT / 'output/video/a3-final'
DELIVERY = ROOT / 'deliverables'
STUDENTS = ('24832520', '24832119')
VARIANTS = ('English-EN-Subtitles', 'Chinese-ZH-Subtitles', 'English-Bilingual-Subtitles')


def expected_files(student):
    folder = MEDIA / student
    return [folder / f'{student}-A3-{variant}.{extension}'
            for variant in VARIANTS for extension in ('mp4', 'srt')] + [
        folder / f'{student}-{suffix}' for suffix in (
            'A3-Transcript-EN-ZH.docx', 'Transcript-EN.txt', 'Transcript-ZH.txt',
            'Personal-Explanation-EN-ZH.txt')]


def make_archive(path, files):
    with zipfile.ZipFile(path, 'w') as archive:
        for source in sorted(files):
            compression = zipfile.ZIP_STORED if source.suffix == '.mp4' else zipfile.ZIP_DEFLATED
            archive.write(source, source.relative_to(MEDIA), compress_type=compression)
    with zipfile.ZipFile(path) as archive:
        bad = archive.testzip()
        if bad:
            raise ValueError(f'Archive checksum failed: {bad}')
    print(f'{path.relative_to(ROOT)}: {path.stat().st_size / 1024**2:.1f} MiB')


def main():
    common = [MEDIA / 'README-交付说明.txt', MEDIA / 'VIDEO-INFO.json']
    files = common + [path for student in STUDENTS for path in expected_files(student)]
    for path in files:
        if not path.is_file():
            raise FileNotFoundError(f'Expected media file is missing: {path}')
    info = json.loads((MEDIA / 'VIDEO-INFO.json').read_text())
    assert len(info['videos']) == 6
    assert all(0 < video['duration_seconds'] < 900 for video in info['videos'])
    manifest = {
        'prepared': info['prepared'],
        'source_revision': info['source_revision'],
        'files': [{'file': str(path.relative_to(MEDIA)), 'bytes': path.stat().st_size,
                   'sha256': hashlib.sha256(path.read_bytes()).hexdigest()} for path in sorted(files)],
    }
    manifest_path = MEDIA / 'MANIFEST.json'
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    common.append(manifest_path)
    DELIVERY.mkdir(exist_ok=True)
    for student in STUDENTS:
        make_archive(DELIVERY / f'{student}-A3-Videos-and-Transcripts.zip', common + expected_files(student))
    make_archive(DELIVERY / 'A3-Final-Videos-and-Transcripts.zip', files + [manifest_path])
    texts = [path for path in files if path.suffix in {'.txt', '.docx'}]
    make_archive(DELIVERY / 'A3-Two-Person-Transcripts.zip', texts)


if __name__ == '__main__':
    main()
