"""Build A3 source packages from tracked source and explicit local artifacts."""
import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'deliverables/A3'
SCOPES = ('clientside', 'adminside', 'api', 'tests', 'project',
          'app.js', 'README.md', '.gitignore', '.gitattributes')
VIDEO = 'Good-Together-A3-English-Demo.mp4'


def git(*args):
    return subprocess.check_output(['git', '-C', str(ROOT), *args])


def source_files():
    # Untracked notes, credentials and local media cannot enter source archives.
    names = git('ls-files', '-z', '--', *SCOPES).decode().split('\0')
    result = []
    for name in sorted(set(filter(None, names))):
        path = ROOT / name
        if (any(part in {'node_modules', '__pycache__', '.git'} for part in path.parts)
                or path.name in {'.DS_Store', '.env'}
                or (path.name.startswith('.env.') and path.name != '.env.example')
                or path.suffix in {'.log', '.pyc'}):
            continue
        if path.is_symlink() or not path.is_file():
            raise ValueError(f'Expected a regular source file: {name}')
        result.append(path)
    required = {'app.js', 'clientside/index.html', 'adminside/index.html',
                'api/package-lock.json', 'api/database/charityevents_db.sql',
                'project/SUBMISSION_CHECKLIST.md', 'project/package_delivery.py',
                'project/demo/VIDEO-INFO.json', 'project/demo/A3-English-Transcript.md',
                'project/demo/A3-English-Captions.srt'}
    missing = required - {p.relative_to(ROOT).as_posix() for p in result}
    if missing:
        raise ValueError(f'Required source is not tracked or staged: {sorted(missing)}')
    return result


def record(path, base):
    return {'file': path.relative_to(base).as_posix(), 'bytes': path.stat().st_size,
            'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--include-video', action='store_true',
                        help='Include the existing local MP4; fail if it is missing.')
    args = parser.parse_args()
    paths = source_files()
    pdf = ROOT / 'output/pdf/Good-Together-A3-Documentation.pdf'
    if not pdf.is_file():
        raise FileNotFoundError('Build the report first: python3 project/build_documentation.py')
    report_inputs = [ROOT / 'project/PROJECT_DOCUMENTATION.md',
                     ROOT / 'project/build_documentation.py', *list((ROOT / 'project/figures').glob('*.png'))]
    if any(p.stat().st_mtime > pdf.stat().st_mtime for p in report_inputs):
        raise ValueError('PDF is older than its inputs. Rebuild the documentation first.')
    video = ROOT / 'output/video/a3' / VIDEO
    if args.include_video and not video.is_file():
        raise FileNotFoundError(f'Local demonstration video is missing: {video}')

    components = {
        'clientside': [p for p in paths if p.relative_to(ROOT).parts[0] == 'clientside'],
        'adminside': [p for p in paths if p.relative_to(ROOT).parts[0] == 'adminside'],
        'api': [p for p in paths if p.relative_to(ROOT).parts[0] not in {'clientside', 'adminside'}],
    }
    generated = []

    def copy(source, destination):
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination)
        generated.append(destination)

    def write(destination, text):
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text(text, encoding='utf-8')
        generated.append(destination)

    for student in ('24832520', '24832119'):
        target = OUT / student
        target.mkdir(parents=True, exist_ok=True)
        for component, files in components.items():
            destination = target / f'{student}A3-{component}.zip'
            with zipfile.ZipFile(destination, 'w', zipfile.ZIP_DEFLATED) as archive:
                for path in files:
                    archive.write(path, path.relative_to(ROOT))
            generated.append(destination)
        copy(ROOT / 'api/database/charityevents_db.sql', target / f'{student}A3-database.sql')
        copy(pdf, target / f'{student}A3-Documentation.pdf')
        copy(ROOT / 'project/SUBMISSION_CHECKLIST.md', target / 'SUBMISSION_CHECKLIST.md')
        write(target / 'LINKS.txt',
              'GitHub: https://github.com/364962/prog2002-a3-charity-events\n'
              'SCU public URL: pending account availability\n'
              'SCU admin URL: pending account availability\n'
              'SCU OneDrive video: pending upload\n')
    for name in ('A3-English-Transcript.md', 'A3-English-Captions.srt', 'VIDEO-INFO.json'):
        copy(ROOT / 'project/demo' / name, OUT / 'shared' / name)
    if args.include_video:
        copy(video, OUT / 'shared' / VIDEO)
    write(OUT / 'README-交付说明.txt', """Good Together / A3 本地交付包

24832520：鲁彧的三个源码 ZIP、单一 SQL、项目说明 PDF、清单和链接状态。
24832119：韩卓林的三个源码 ZIP、单一 SQL、项目说明 PDF、清单和链接状态。
shared：英文演示逐字稿、84 条字幕和视频信息；包含 MP4 与否以 MANIFEST 为准。
MANIFEST.json：生成时间、Git 基准、源码校验值和交付文件 SHA-256。

将 clientside、adminside、api 三个 ZIP 解压至同一目录，保留三个同级目录。
依照 README 安装依赖、导入新数据库并设置环境变量；使用 node app.js 启动。
本机配置网址：http://127.0.0.1:3090/；管理端：http://127.0.0.1:3090/admin/。

GitHub：https://github.com/364962/prog2002-a3-charity-events
四个阶段：数据库与流程；API 与公开报名；管理端与启动部署准备；文档与打包。
具体提交及实际日期见源码 project/DELIVERY_PLAN.md 和 GitHub 历史。
使用实际提交时间，没有设置自动推送或倒填日期。

测试日期、范围和结果见源码 project/evidence/summary.json，均为本地验证。
正式提交尚需：教学组和 Team ID、两人各自的 SCU cPanel 部署、
教师对私有仓库的访问权限、SCU OneDrive 视频分享链接，以及各自的保密互评表。
现有视频为本地技术演示，最终还需补充个人实际贡献与线上部署说明。
如果 username 指 SCU 登录名而非学号，请在提交前改源码 ZIP 的前缀。
重新打包会覆盖生成的同名文件；个人填写的最终链接请另行保存。
""")
    manifest = {
        'prepared_at': datetime.now(timezone.utc).isoformat(),
        'status': 'Local delivery only; SCU deployment and personal submission evidence pending',
        'source_head': git('rev-parse', 'HEAD').decode().strip(),
        'source_changes': git('diff', '--name-only', 'HEAD', '--', *SCOPES).decode().splitlines(),
        'source_note': 'Bytes come from tracked/staged working files; hashes identify the exact content.',
        'video_included': args.include_video,
        'source_files': [record(p, ROOT) for p in paths],
        'files': [record(p, OUT) for p in sorted(generated)],
    }
    write(OUT / 'MANIFEST.json', json.dumps(manifest, indent=2, ensure_ascii=False) + '\n')
    bundle = OUT.parent / 'A3-Local-Delivery.zip'
    with zipfile.ZipFile(bundle, 'w', zipfile.ZIP_DEFLATED) as archive:
        # This list excludes stale or unrelated files in the output directory.
        for path in sorted(generated):
            archive.write(path, Path('A3') / path.relative_to(OUT))
    print(f"Prepared {len(manifest['files'])} files and {bundle}")


if __name__ == '__main__':
    main()
