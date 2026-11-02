"""에셋·정리 도구가 빌드와 같은 소스 목록을 읽는다."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

def source_paths(*groups):
    manifest = json.loads((ROOT / 'src/modules.json').read_text(encoding='utf8'))
    if manifest.get('version') != 1:
        raise ValueError('지원하지 않는 소스 목록 버전')
    result = []
    for group in groups:
        paths = list(manifest['html'].values()) if group == 'html' else manifest['bundles'][group]
        for relative in paths:
            absolute = (ROOT / relative).resolve()
            if not absolute.is_relative_to(ROOT) or not absolute.is_file():
                raise ValueError(f'잘못된 소스 경로: {relative}')
            result.append(str(absolute))
    return result

def source_file(group, name):
    matches = [file for file in source_paths(group) if Path(file).name == name]
    if len(matches) != 1:
        raise ValueError(f'소스를 하나로 찾을 수 없음: {group}/{name}')
    return matches[0]
