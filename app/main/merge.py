import re
from collections import defaultdict

def escape(string):
    escape_dict = {'{+': '\\{\\+', '+}': '\\+\\}',
                   '[-': '\\[\\-', '-]': '\\-\\]'}
    pattern = re.compile('|'.join(re.escape(key)
                         for key in escape_dict.keys()))
    return pattern.sub(lambda match: escape_dict[match.group(0)], string)


def unescape(escaped_string):
    escape_dict = {'\\{\\+': '{+', '\\+\\}': '+}',
                   '\\[\\-': '[-', '\\-\\]': '-]'}
    pattern = re.compile('|'.join(re.escape(key)
                         for key in escape_dict.keys()))
    return pattern.sub(lambda match: escape_dict[match.group(0)], escaped_string)

def wrap_word(change_type, line):
    start = 1 if line.startswith("\n") else 0
    end = len(line) - 1 if line.endswith("\n") else len(line)
    inner = line[start:end].replace(
        '\n', ('+}\n{+' if change_type == '+' else '-]\n[-'))
    inner = '{+' + inner + '+}' if change_type == '+' else '[-' + inner + '-]'
    return (("\n" if line.startswith("\n") else "") + inner + ("" if line.endswith("\n") else ""))


def find_added_word(line):
    matches = re.finditer(r'\{\+(.*?)\+\}', line)
    return [(match.start(), match.group(1), '+') for match in matches]


def find_deleted_word(line):
    matches = re.finditer(r'\[\-(.*?)\-\]', line)
    return [(match.start(), match.group(1), '-') for match in matches]


def detect_changes(diff_string):
    changes = {}
    diff_lines = diff_string.split("\n")
    type_key = {'+': 'add', '-': 'delete'}
    for line_num, diff_line in enumerate(diff_lines):
        detected_words = find_added_word(
            diff_line) + find_deleted_word(diff_line)
        if not detected_words:
            continue
        if len(detected_words) == 1 and len(detected_words[0][1]) == len(diff_line) - 4:
            changes[line_num+1] = {
                'line': True,
                'type': type_key[detected_words[0][2]]
            }
        else:
            detected_words.sort(key=lambda x: x[0])
            words = [(word[0] - 4 * i, word[1], word[2])
                     for i, word in enumerate(detected_words)]
            word_changes = []
            change = {'line': False}
            for word in words:
                word_changes.append({
                    'type': type_key[word[2]],
                    'col': word[0],
                    'length': len(word[1])
                })
            change['info'] = word_changes
            changes[line_num+1] = change
    return changes


def update_deco(changes, decorations):
    new_deco = defaultdict(list)
    for deco_line_num, deco_list in decorations.items():
        print(f"deco_line_num: {deco_line_num}, deco_list: {deco_list}")
        deco_line_num = int(deco_line_num)
        for deco in deco_list:
            for change_line_num, change in changes.items():
                print(
                    f"    change_line_num: {change_line_num}, change: {change}")
                change_line_num = int(change_line_num)
                if change_line_num < deco_line_num:
                    print(1)
                    if change["line"]:
                        print(2)
                        deco_line_num += 1 if change["type"] == "add" else -1
                        print(f"deco_line_num: {deco_line_num}")
                    continue
                elif change_line_num > deco_line_num:
                    print(3)
                    break
                # change_line_num == deco_line_num
                if change["line"]:  # 줄 단위의 변경 사항
                    if deco["type"] == "line_hide":
                        print(4)
                        # line_hide 하는 범위에 겹치는 변경사항이 있으면 데코 삭제
                        pass
                    else:
                        print(5)
                        if change["info"]["type"] == "add":
                            print(6)
                            new_deco[deco_line_num + 1].append(deco)
                else:  # 단어 단위의 변경 사항
                    print(7)
                    deco = update_word_deco(deco, change["info"])
            if deco:
                new_deco[deco_line_num].append(deco)

    return new_deco


def update_word_deco(deco, word_changes):
    start = deco["start"]
    end = deco["end"]
    for change in word_changes:
        # line change 분류
        change_end = change["col"] + change["length"] - 1
        if change["type"] == "add":
            if change["col"] < start:
                print("(1)")
                start += change["length"]
                end += change["length"]
            elif change["col"] >= start and change["col"] <= end:
                print("(2)")
                end += change["length"]
        else:
            if change["col"] < start:
                if change_end < start:
                    print("(3)")
                    start -= change["length"]
                    end -= change["length"]
                elif change_end >= start and change_end < end:
                    print("(4)")
                    start = change["col"]
                    end -= change["length"]
                else:  # change_end >= end
                    print(5)
                    return None
            elif change["col"] >= start and change["col"] <= end:
                if change_end >= start and change_end < end:
                    print("(6)")
                    end -= change["length"]
                elif change_end >= end:
                    print("(7)")
                    end = start + 1
    deco["start"] = start
    deco["end"] = end
    return deco



