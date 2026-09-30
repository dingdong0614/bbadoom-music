# 빠둠뮤직: 사이트에 쓰인 글자만 담은 Pretendard 서브셋 1파일 생성
# 사용: python subset.py <repo> <PretendardVariable.ttf>
import sys, glob, os, re
from fontTools.ttLib import TTFont
from fontTools import subset
from fontTools.varLib import instancer

repo, ttf = sys.argv[1], sys.argv[2]
chars = set(chr(c) for c in range(0x20, 0x7F))
chars |= set("·•…“”‘’「」『』《》〈〉【】※→←↑↓↗★☆♪○●◎◇◆□■△▲▽▼ⓒ©®™°℃%‰±×÷∙‧、。，！？：；（）～")
files = glob.glob(os.path.join(repo, "*.html")) + glob.glob(os.path.join(repo, "data", "*.json")) + glob.glob(os.path.join(repo, "js", "*.js"))
for f in files:
    with open(f, encoding="utf-8") as fh:
        t = fh.read()
    t = re.sub(r"<script type=\"application/ld\+json\">.*?</script>", "", t, flags=re.S)
    chars |= set(t)
chars = {c for c in chars if ord(c) >= 0x20}
hangul = sum(1 for c in chars if 0xAC00 <= ord(c) <= 0xD7A3)
print("chars", len(chars), "hangul", hangul)

font = TTFont(ttf, lazy=False)
opts = subset.Options()
opts.flavor = "woff2"
opts.layout_features = ["*"]
opts.name_IDs = ["*"]
opts.notdef_outline = True
opts.drop_tables += ["DSIG"]
sub = subset.Subsetter(opts)
sub.populate(text="".join(sorted(chars)))
sub.subset(font)
font = instancer.instantiateVariableFont(font, {"wght": (400, 900)})
out = os.path.join(repo, "fonts", "PretendardSubset.woff2")
os.makedirs(os.path.dirname(out), exist_ok=True)
font.flavor = "woff2"
font.save(out)
print("saved", out, os.path.getsize(out))
