Great companies have great design
0:00
The agents can speed you up. They can save you a lot of work and they can do tasks like translation or resizing for
0:05
you, but we're a big believer in the human element of design and and how important that is. And so we're trying to create a tool that lets humans work
0:11
really fast with agents. It's probably very tempting to use whatever cloud design spits out. I don't think it helps you stand out from the crowd. And so I
0:18
think design is this great differentiator. And if you look at every great company of the last 10, 20 years, basically all of them have exceptional
0:24
design. And so I think if you want to be one of those really great companies, you have to put the car in on design and and make sure that you stand out.
0:37
Today I'm excited to welcome Steven Haney, the founder of Paper, an AI
0:42
native design tool that's been taking the design world by storm. We're already
0:48
using paper a ton here at YC for all of the design work that we're doing internally and I'm excited for him to
0:54
show off how the product works to everybody out there. So Stephen, thank you so much for joining. Yeah, I'm honored to be here. I've
1:00
watched the show a lot and so it's it's really nice to be to be on. Thank you for having me. Maybe to start uh tell people what is
What is Paper and why build it?
1:06
paper? Yeah, well paper is a design tool. It's an agent native design tool and what that means is we use HTML and CSS as the
1:14
actual rendering engine and that makes it very easy for agents to use because they understand HTML and CSS really well
1:20
and historically a lot of design tools have custom rendering engines and those uh are a lot harder for agents to use
1:26
and so you'll see higher token spend slower times lower accuracy. So what we're building with paper is it
1:32
basically it's a group of people. There's about 12 of us now. All designers and engineers. Uh we were basically started this out of love for
1:38
design. And now we're just trying to build the best design tool possible for this next era. Yeah. It's crazy to think
1:43
you're only 12 people because I hear about you all the time from everybody who's using you and especially from so
1:48
many founders that are just picking the design tool that they want to build and live in all the time and doing that from
1:55
the ground floor being AI native themselves. They're looking for the AI native tools that is going to work best.
2:00
So maybe talk about what was your inspiration for building paper and why were some of the existing tools that are
2:06
out there not good enough for you? It really was born from a love of design. Uh as I said this was a I started as a solo founder. Um and it was
2:13
really the side project that just kind of kept going. I had months where I was like is anyone going to care about paper? And then it was like oh yeah
2:19
people do care you know this is great. It's really taking off. It was the thing I was going to do anyway. It was very much the thing I was going to do anyway,
2:24
which I really believe starting a startup, you should do that. You should do the thing you're going to do anyway. You should do the thing where you have
2:29
founder market fit. And for me, this is where I had the strongest founder market fit because I love building tools for
2:35
creative professionals. Um, it's something I'm going to wake up every day and like I'm not going to have a bad day building creative tooling. So, that came
2:41
first um even before the market or competitors or any of that kind of thing. And then looking around it was like, well, gosh, I mean, you know,
2:47
we're big fans of Figma. You almost can't talk about design without saying, you know, Figma these days. um they've done a lot for the design industry. Uh
2:53
they are they're have a huge company now and they're they're doing very well with enterprise companies and we were thinking well maybe there's time for a
2:58
new tool to focus on the designer um and just really spend a lot of time there's so much change with AI with agents uh
3:04
can we build something that's agent native um building on HTML and CSS and just build this you know nextgen tool
3:10
and so that's kind of what we're going after and so far so good. Yeah. And what does that mean to be an an AI native agent native design tool?
What makes Paper agent-native
3:17
It's really about the fundamental technology. Um, so using HTML and CSS as the rendering engine, we actually did it
3:24
to help with designer developer handoff. We were like, hey, if the designer can have this constraint free system where
3:29
they it feels like a Figma or a sketch, but by the way, it's HTML. They don't have to know that. That's great. The handoff will be better. Uh, it turns out
3:36
if you build a great handoff for humans, you've also built a great handoff for agents because agents understand HTML and CSS and it's in their training data.
3:43
And so when you ask an agent to work with a paper file, it's literally just reading the CSS out and agents know
3:49
exactly what to do with it. You try to basically extend the agent with a visual interface is sometimes how they get
3:55
paper's a design tool, but it's also this visual interface for agents. Um we see sales folks, engineers, all kinds of
4:00
people are using it because prompting isn't always the best input mechanism for agents. Sometimes you want to drag
4:06
and draw and it's just faster to be able to do uh direct manipulation. Yeah, it's interesting because as it becomes easier
4:12
and easier to build software, the figuring out what to build and getting inspiration for how to build it seems to
4:19
be one of the trickiest pieces right now and one of the biggest bottlenecks. How do you think about using paper to be
4:24
able to solve that piece of the creative workflow? We see there's more software than ever being created and engineering teams are
4:30
moving so fast now. Um, and I don't know how you feel about this, but I haven't felt like the software is getting better
4:36
necessarily. I haven't I haven't had a great software experience in the last 6 months. Blew me away. And so it's important for us. Like I grew up I'm
4:42
like a fan of software. Like I love building great software. The best compliment you can give me is that paper is really great software. And so I want
4:49
more of that for the world. And so I want to help designers and people with taste keep up, you know, with all of the
4:54
software that's being created. Um, and so giving them a tool that can move at the speed of of prompting and of the
4:59
agents, uh, you know, rather than being like just pulled into an IDE or just pulled into prototyping, but being able
5:04
to still do the traditional design work at a at a faster pace. Uh, I think it's really really important. I'd love to see a demo. Can you show us
5:10
how it works? Yeah, let's jump in. So, it's a very familiar interface if you've used, you know, uh, canvas tools.
Demo: Shaders, image generation, and brand design
5:16
Um, sometimes I like to start with the visual things. So because we uh are
5:21
using basically the browser to render, we can also render shaders really easily. And shaders are um this
5:28
basically WebGL uh animations that we build. This is called paper shaders.
5:33
It's a library we put together fully open source, fully, you know, feel free to use it for whatever you want to do.
5:39
Um and the shaders are just so fun and brand designers love these because you can get all kinds of different looks. This is just one shader with different
5:45
settings. Um and so you can do all kinds of stuff. I know at YC you guys have been using we've been using these all the time. We
5:50
love and and I I think you know for us and I imagine a lot of people out there this is probably their first
5:57
introduction to using paper. This is something that it feels very modern, cutting edge that would have
6:03
been really difficult to do a year ago and then you guys have made this really
6:09
simple and native to the product to the point where it's showing up everywhere because it's so easy to do it now. Right. That was part of our hope was can
6:15
we can we make this more accessible to designers because uh if you're a designer and you're you know living in a
6:21
traditional design tool all day, you want to create a shader effect. You want to describe how an AI loading state is
6:26
working. Um and that's what I kept hearing was like I need to make loading states for AI and how do I do it? And so we just thought it'd be nice to give
6:32
people these these animated effects that um they can customize and you know not just use the out of the box ones, but
6:38
you could get in here and like tweak things and make them make them your own and you can you can do all kinds of cool stuff. You can do blending modes of
6:44
course to like create combinations. Um and you can also these have been really popular is some of these more subtle
6:50
effects. This is a half te dots and you can pull other things into the effect.
6:56
So this is pulling the uh this what we call neuron noise into the half te dots and you can try different things and and
7:02
get different effects. Um, and we spend so much time, we actually studied literal paper to study the like the
7:09
randomness of, you know, actual physical effects and we try to model that in code. And so I think that's one of the
7:14
reasons our shader library stands out is we go to ridiculous degrees to make it to make it as good as we possibly can.
7:20
And so brand designers really love this. So like, you know, one example is Quarter. I don't know if you you guys
7:25
know the the Quarter posters. um they are really really cool uh posters that
7:31
this this team makes that uh they do I think it's like earning reports and they've transitioned a lot of these to
7:37
be built in paper now because they can get this cool retro you know vibe that really fast. So I love this the work
7:43
they're doing is really cool and I'm I'm like honored that they're using paper to achieve some of these uh some of these posters.
7:48
Yeah, it's really cool. We've used it for uh we have startup school and so EV who leads design here at YC has actually
7:54
created custom animated shaders with the YC branding with people's names on them
8:00
tickets that are you know you can play with and animate when people get accepted and send it to them and it's a great experience for the person
8:06
receiving it. It feels very thoughtful and intentional and highly designed and it's also creates something that's very
8:11
sharable that people want to share out which helps to spread the word also all because of the design and because of the
8:17
shaders. Really fast way to elevate the visuals and help it be a little more special. So shaders are very popular with the brand designers. We also do um
8:24
this is kind of like a lesserk known thing to paper. We actually have a really great image generation library where you can use all kinds of models
8:31
all at once. And so, I don't know, we'll just do a a thoughtful man staring at the moon illustration.
8:40
Um, you can imagine for a brand piece or whatever you're working on. And so, this will use uh four different models at once. And you can quickly explore the
8:46
possibility space of whatever kind of illustration you need to do. That's very cool. Yeah. So, I see you have it set to variety pack there. Is
8:52
that the thing that gives you the four at once? You can pick a certain model if you want to. They all have different strengths and weaknesses. Uh or you can do the
8:59
variety pack and get we kind of rotate which models are in there just as we new new models are always coming out. Y um
9:04
and and it just lets you quickly explore and you can provide inputs into it. You can let's like you know I'll copy this
9:10
shader as a image and then you can feed the im the image into it and uh uh make this more colorful please. So you can do
9:18
all kinds of different workflows combining these you know things to create really cool graphics really really fast. Um along the same lines,
9:25
you can also vectorize. You can do this extract colors is really well let's let's do this one. Um so the agent made
9:32
a really colorful thing and I can extract the colors and it just pulls out the colors and so I can explore ideas
9:37
very rapidly this way. Um and generate new textures things like this. So this is kind of the brand side of paper. This
9:43
is the graphics. And what we find is like all designers need to make brand assets. They need to make you know social media posts or whatever it is.
9:49
which is interesting also because you know I think a lot of people use and think of Figma as product design
9:55
and um it certainly can do a lot of brand design element but didn't start as much that way and it seems like you can
10:00
do product design and there's all these really cool tools to do a lot of brand design work too. Yes.
10:06
Graphic design which which you know traditionally I think has been uh more difficult with a lot of these tools.
10:11
Yeah. I it's it's part of our values. We love both, you know, and so I think the the product design is very interesting,
10:16
but we'll always have the the brand design and the and the graphics, too. To be honest, the way we think about the
10:22
shaders is um we spend our this is our marketing budget. We don't think of this as product development, we think of it
10:27
instead of buying ads, let's make this useful library for the world um and spend that effort and that money on on
10:33
building this shader library. And we get a lot of attention. It works really well. Similarly, like we develop a font, paper mono is a new font that we're
10:39
launching. I'm really proud of it's really really good. Um, and we we found there's no mono font that is just kind
10:45
of an all-rounder that you can use in marketing, that you can use in code. Most of them are built for the terminal. And so we wanted one that you can use as
10:51
part of your brand. So we made paper mono. It's launching in a couple weeks. That's marketing for us that that you know, instead of buying an ad, let's
10:56
build a font better better for the world, right? So Eve at YC was in in New York City at a dinner the other night
11:02
and she ran into someone wearing a paper mono shirt, which I thought was so cool. There's only I don't know hundred of these in the world.
11:07
Yeah. How do you get one of these? Yeah, we can get you one. We we'll see it whenever [laughter] we want to set up a merch shop, you know, paper paper
11:12
merch soon. But this is paper mono and we have a, you know, a great mini site launching soon. Uh we spend a lot of
11:18
time on on the legibility of numbers because that's an area that a lot of mono fonts really struggle with. We just
11:23
think this very very legible, very usable mono font. U so I'm really excited about this. Right. It's so fun.
11:29
We get to do these things as as uh you know, just kind of part of our marketing basically. You mentioned that uh the product
Design-to-code and the new agent stack
11:34
started to help solve the uh design to dev handoff. Yeah. Um, show us how you're able to do that
11:40
in the product. Well, yeah. So, it started as, hey, this is code. This is literally a React component. Why don't we let you copy it
11:47
as a React component? And so, this shader that we're looking at right now, you can rightclick and copy as React.
11:52
And when you paste it, you get the literal code that we're looking at. Um, and so this was just a really fast way
11:58
of like, hey, the designers made this really cool animation. They've dialed it in perfectly. They're the designer,
12:03
right? And let's let them copy that out and ship it. And so we've seen these take off all over the internet. Um
12:08
people shipping these these React components. But it goes further. So anything that you're looking at in paper is code. You know, this frame with this
12:15
box inside of it is code and it's basically a website already. And so you can copy it as Tailwind or you can copy
12:20
it as React uh and and just grab out the the code. That's where we started and that was pretty good. We already saw
12:26
some people using it. Um and then in what was this last December 2025, the cloud code explosion happened
12:32
and I didn't think designers were going to be in terminals. I never thought that would be a thing we'd see. Uh but we clearly did. And so that that was the
12:39
moment where we were like, gosh, we got to get onto the desktop. At that point, we didn't have a desktop app. So it was like, gosh, we got to get onto the desktop. That's where things are
12:45
happening now. Um local repos, designers have repos, they're learning GitHub. Let's be part of this explosion. The way
12:51
we see it is kind of the new agent stack. And what I mean by that is you'll see, you know, I have cursor, I have
12:56
cloud code, you have multiple agents. Uh you have paper as a visual way to communicate with the agents. And then maybe you have a GitHub or, you know,
13:02
the code review. That's what we see builders using now. I mean, is that what you see too? Like the newest YC batches?
13:08
Yeah, that's a lot of what we see and and we even see a lot of uh that getting rolled into uh single apps. Our friends
13:15
at Conductor uh you can push code and merge code and and do everything that you need directly. Yeah, there we go.
13:22
Yeah, I have conductor up too directly from the app. And so more and more it's kind of being consolidated um
13:27
into apps rather than having multiple discrete apps as part of the stack too. That's what we see too. And and conductor and paper are this like
13:33
pairing right now that a lot of people in the community are are using both together. I think I think it's so cool.
13:39
I love conductor. It's great great product. But we saw this cloud code happening. Let's get on the desktop. We build an MCP server into our desktop
13:44
app. And I'll give you a demo of some of the stuff it can do. Let's use we use conductor for this. Why not? Um I'll
13:50
just say hey conductor in paper please make a small test frame saying hello to
13:58
YC. Um, and I'll show you what it's doing. And we we'll get into more complex cases, but just to show you how
14:04
the basic technology works. Um, as the agent uses the MTP of paper, which we'll
14:09
put on the right half of the screen. Um, we give it tool calls to like, hey, which fonts are available? What's the
14:16
basic setup of this page? And then it literally runs tools like write HTML. This is literally the, you know, it's uh
14:22
in JSON format, but there it's literally sending us HTML. Um, and the paper
14:29
engine is just able to take HTML. It knows what to do with it. There's there's no translation there. The agent writes HTML, paper can render HTML, and
14:36
you don't have to like switch back and forth between formats. What that does is it saves you tokens. It makes it run faster. Uh, and you just
14:43
get less weird hallucinations. And this is really the moment we took off because people are doing design to code. They're
14:48
doing code to design. I'll give you another example in cursor. This is our actual paper code base. And I'll just
14:54
say, "Hey, can you put at colors.css onto the paper canvas as a style guide?"
15:00
So, this is our actual CSS file from paper uh the codebase paper, not the product. And, um, cursor is going to
15:07
take that and then render it onto the canvas. And so, we see a lot of people doing, you know, auditing of their codebase, what exists. Uh, you can do
15:14
component architectures, ask for diagrams, and it really just it brings the design tool into the rest of the
15:20
stack. We're so used to the design tool being over somewhere else, right? And having this wall between it and this is
15:26
like the design tool is now part of the entire stack. Yeah. Is is kind of the goal here. Yeah. I mean, one of the things that's
15:31
always been broken with that handoff like you're talking about is designers would design a thing and then they give
15:37
it to the developers and then maybe it wouldn't actually be built and shipped
15:42
in the way, you know, the designer originally intended when they were working in the canvas. Um or even if it
15:48
was things would just get out of sync and the code would evolve and it would
15:53
never get wrapped back into the design. Yeah. And so it's what is the source of truth and what's really nice about this
15:58
is the code is the source of truth and both systems know how to work on that same codebase. Exactly. Yeah. We we see so many teams
16:06
maintain two copies of their design system. Yeah. And it's not a tractable problem to keep them in sync. It's
16:11
impossible really. and and so you have a lot of maintenance cost with keeping both updated and you just have accuracy
16:17
problems. So what we see from the newer companies, the more agentic builders is
16:22
they are treating the codebase as a source of truth and you know we don't have components in paper yet and it's this common complaint
16:28
like people want components really a lot and we're working on that but you don't need them because your codebase is a
16:34
source of truth and you can kind of like summon things in as you need them and we took that a step further too. We build a a Chrome extension where you can grab
16:39
your live site and copy that into the paper canvas, which is um a really nice way to start from what your users are
16:46
seeing and build on top of it and iterate. Maybe that's a good segue. Should we review some some user submitted sites
Design Review: Legion Health
16:52
and then I would love to I would love to use that feature to be able to pull some of them into paper. Yeah.
16:57
And make some tweaks on it and just see what we can live edit to to try to um uh improve some of the sites.
17:03
I would love to. It's always my favorite section of the show. [laughter] Awesome. Let's do it. So, the first one we got here is Legion
17:09
Health Psychiatry as low as $0 with insurance online medication management for ADHD, depression, anxiety, bipolar
17:16
disorder, and more. Um, I don't know. When I first look at this, I see the little pill up there at
17:21
the top. And this kind of it makes me think this was just like a vibe coded thing because it matches so much of the
17:27
style that we see um that the agents are just spitting out. There's definitely like a fit and finish
17:32
thing here. I think little things like how these these um these sections kind of like leave a little gap. The pill is
17:38
very generic. I think overall though the I can understand the value prop very clearly which I think is great. You know
17:44
that's a big part of design too is like can you comprehend what's going on? It shows the benefit over on the right of like being
17:49
being very happy in a field or [laughter] something. Yeah. You're having a great life. Uh so I think like those parts are working. I think it's more about just
17:56
tightening up um here again. you know, it tightening up some of the design would really help the brand feel more
18:02
serious, more elevated, a little more trustworthy. I think um this feels, you know, I don't know if I trust this brand
18:07
right now. And this is a area where you have to have trust, right? Yeah. Yeah. So, what is the thing when you look at this that makes you not trust
18:14
it? Some of the design elements is like the the alignment of things, the contrast choices, they feel maybe vibe coded or
18:20
like somebody didn't spend a lot of attention to this and then your mind goes to what else don't they spend attention on? The one other thing is
18:26
like this must be a YC company, but I don't see that here. And I would say that'd be a great thing to call out [laughter]
18:32
as a little bit of social proof or evidence, but like this is nice. I mean, there's a lot to like here. I would just
18:37
I would work on the fit and finish a little bit. I'll show you paper snapshot. Paper snapshot is a way to grab content from your live site.
18:44
This replaces taking screenshots of of things. So, we'll just grab this section because I think this is a cool one to
18:49
work on and we'll paste it into paper. And um these are all live sections, right? So
18:55
this is not a screenshot. This is actual uh stuff that you can come in here and edit and you can like alt drag and get
19:01
another copy of it. All these things. Um so let's ask the agent to work on
19:06
this a little bit. And one of the things I like to do is actually just ask it for a bunch of variations. So we'll use let's uh conductor. Hey
19:14
conductor. Uh this is using GPT 5.5. Can you make three new variations of my
19:21
selection in paper focusing on the craft and alignment uh and contrast choices to
19:29
elevate the visuals? You can do a lot of prompting, but I often find like simple prompting is is fine. Honestly,
19:35
what's really powerful about this, a couple things. Um, one, I love this concept of just spitting out a bunch of
19:42
different variations. It's the best way to get inspiration. And sometimes, you know, you have a sense of what you want, but you don't really know. And this is a
19:49
great way to look at a bunch of things and go, I like that from this one. I like this from this one. And combine it
19:54
and and make so much more progress so much faster rather than being stuck in that creative rut. And then the other thing that's really cool is you're able
20:00
to just say, hey, the thing that is my selection on the canvas and paper, and it knows what that is, and now it's able
20:06
to go to work on that, which is which is really powerful. I think I had the wrong selection, though. I grabbed the uh the YC card.
20:12
[laughter] Let me let me uh restart it there one more time using my selection. Oh, I see
20:17
what happens. It it changed it u with the AVHD
20:23
content. Um oh actually you know what this is a good way to show another thing we can do. So we can leave a comment on this frame and say um please make three
20:32
new variations of this content. Explore the layout for visual impact.
20:38
And instead what I'll do, so I left a comment in paper and I'll switch over to the agent now and say um please address my comments in
20:46
paper. There's only one. And this will be another way that you can kind of like target. And so you can imagine having a big design and leaving all of your
20:53
feedback and then just setting your agent on it. Yeah. Letting it spin, you know. But we see a lot of folks are
20:58
leaving these running like overnight. They're setting up loops of of an agent just generating hundreds of variations.
21:05
And it's actually a challenge for us to be like agent scale with our servers and everything. Like they're doing a lot more work than I thought they were going
21:10
to be doing. Um, and it's so cool and they they now they come in and they curate, you know, they come in, oh that's a good idea, that's a good idea.
21:15
Let me combine these things together. And it's kind of this new curation design process that I think is really interesting.
21:20
It's so cool to think about this world where you just go in, you leave a bunch of comments on the work, you go to bed, you wake up in the morning, and they're
21:27
all either addressed or lots of iterations for you to choose from are just sitting there waiting for you.
21:33
Exactly. I think it's really cool. It's a new world. I find that it'll do things that I know but I wouldn't have thought of because I
21:38
was too busy. And so it kind of like it lets me scale myself a little bit and have more time in my day because I can
21:44
just set it on these tasks that are maybe more boilerplate or I just don't have time to do four things at once and
21:49
so let me set the agents on it to to go address it. So it's uh this is 5.5. It is working through ideas now and you'll
21:55
see it iterate. It'll it can take screenshots so it'll notice things like that alignment isn't it's running right into each other. it'll fix itself as it
22:02
goes through. Um, and yeah, that's cool. Okay, so it's actually spit back a variation here, but
22:09
the alignment's a little screwed up there. And it's still working. So, it's not done once it gives you something. It's It's an iterative thing that's
22:16
happening here, right? It checks its work. Yeah. And it can do uh agents are getting better at this, too, all the time. For instance, I see
22:22
like the first shot it ran the text over the cards. It'll usually catch that and correct it. Or if it doesn't, you can just, you know, tell it, "Hey, correct
22:28
the the text overflow." Mhm. Um, let me do this. We'll set to fit and
22:34
we'll pop back in conductor. Please address any text overflow issues.
22:41
The other thing I noticed too is is the models are always getting better and they have different strengths and weaknesses. And so I I often use fast models for
22:48
demos like this and they tend to make more mistakes. And so, you know, if you're doing this for real, you're probably using something that's right at
22:54
the cutting edge and those deliver, you know, better performance. Yeah. What are your go-to models these days? So, Fable is a wonderful, you
23:01
know, I think that's probably the best visual taste right now. Yeah, it's very slow. That's why I don't use it for demos. Yeah, I use Cursor's uh composer
23:08
2.5 actually a lot. It's a very good model for the speed. Uh quality is very good, very precise. Uh 5.5 is is still
23:15
usually a pretty good balance. Um so, I jump around. I think if I need pure taste, it's it's the the fable. Yeah. uh
23:21
and and the anthropic models in general. If I'm going for precision or I have like, hey, I have a 100 artboards and I
23:26
need a task to like go down the entire list, I might reach for the composer. Uh it it just does a really precise job.
23:32
I find cursor is a really good harness. It it's not too lazy. It'll often spin up sub agents to get jobs done. Um so I
23:38
jump around a bit. So here it gave me kind of like three different ideas, you know. Um and I think from here what I
23:43
would usually do, spend a little more time on exactly what I actually want out of out of it and then give it more direction. But I might
23:49
start branching. I might be like, "Oh, I like this. I like, you know, I kind of like the list of this. That's actually very easy to read. Um, I kind of like
23:57
the card layout of this. Actually, like featuring one card and having some other cards to the side is nice. So, I might
24:02
just start branching. And I think the power of this is you can ask five agents to go generate five more of each, you
24:08
know, and kind of find one that really fits um what you're going for. I I think one of the things that's interesting is it gives you a lot of um inspiration and
How to avoid AI design slop
24:16
ideas and then you can start branching and going down a path, but it's still the models that's doing the design and
24:21
it still has some of the hallmarks of the things that you see uh models do
24:26
frequently for better or for worse. And so how do you when you're designing and
24:31
you've got this inspiration, you're like, "Okay, this list is interesting. I hadn't really thought of doing that. Maybe I want to go with that." How do
24:38
you then make it more your own and get out of kind of the the standard slop that a lot of them will spit out?
24:44
Yeah. Well, I have some like very specific rules I can share with you. One is that models love bold. They love bold
24:50
uh styles and and really like try to pull your font weights back. You know, it's so tempting to bold things. Just
24:55
try to pull them back as light as you can get and it'll just magically look better designed. Another thing is um too
25:01
many too many sizes. Uh models love having five, six, seven, eight different font sizes. try to work with three if
25:07
you get down to three. So, let's let's just try it real quick on this one. If we if we bring this down to um uh let's
25:13
see like a like a 500. Even that's maybe heavier than it needs to be. Um same
25:18
here. Like these don't actually need to be bold. This is such a tell of a of a this one up here. The carrot organized
25:25
black is so heavy. Let's just pull that back. And suddenly it looks more designed already. Right. [laughter] Right. It looks
25:30
cleaner. It looks cleaner and more approachable. Black here too. Let's just pull that back. Um, these are really simple tweaks
25:36
that like you can make. The contrast here is pretty good. A lot of times models screw up contrast. Um, so I would that's another step you
25:42
can just make sure is like is the text readable, right? Um, these these little two, three, four, these are a little too
25:48
contrasty for my taste. I would probably pull these back. They're supposed to be a probably just delete them. I mean, those are the kind of things where the models
25:54
like to add numbers or little icons or things like that there. And yeah, it's really cool that you can just go through
25:59
and delete it and it just snaps everything else up rather than leaving a blank space there. Totally. Totally.
26:04
Well, that's one of the powers of of of this tool in general is paper is a design tool first. It's a human design
26:10
tool first that happens to be really really good with agents. And so that means you can customize whatever you need to do. It's you're not stuck with
26:15
like uh the track you're on. You don't you don't prompt again. You can start reaching in and and changing things. Um so yeah, 100% agree. Maybe get rid of
26:22
that one too. The first thing I do is is try to get down to like three font sizes and just pull all that bold way back and
26:28
you'll immediately get something that feels more designed and intentional. Yeah. Yeah. And then what do you do from here? Great. You've got the new section,
26:34
you're excited about it. How do you then wrap it back in? Well, so there's a couple ways. You can you can rightclick and um let me
26:40
actually grab here. Uh you can copy it as React. Um so that's kind of the long way
26:45
though. So I can get this out as code and paste it into my IDE. You can also just ask the agent um to pull this back.
26:51
So, you know, I have the paper codebase open, but you can just say, um, you know, please build my selection in paper
26:59
into a new component in the codebase, which we will not actually ship in paper. It can read everything that we
27:04
just did. And it knows my codebase really well because it's the agent that I use. And so, it can actually pull in this design.
27:09
It'll match the the coding styles that we have and the conventions that we have um, and build it into the into the
27:15
codebase. And if it already existed, usually you would already have this as a component. It would just update it, you know, and it's really really fast. So we
27:21
see a lot of people are just kind of like this is the whole loop now. Like there isn't even a handoff anymore. It's just like one person making these
27:27
changes and iterating and shipping which is really cool. I think it's really cool. Yeah, that's what's so powerful is um
27:32
you know it's easier than ever for designers to actually build and ship things uh in the way that they see it.
27:38
Um and to to actually get that last mile and get something alive and iterate on it and make it better. And it's it's
27:45
tools like this that I think are giving people superpowers which is uh it's it's a whole new world where one person can
27:51
do the work of an entire team. Oh absolutely. Yeah. Absolutely. And I think even in teams we're seeing a lot
27:56
of this too. Um so teams are speaking up using this uh but but I think the core of it is agentic workflows. Um if you if
28:03
you're using agents to accomplish your work you need tools that speak to the agents you know in really well. Uh and
28:09
so that's what we're you know focusing on. YC's next batch is now taking applications. Got a startup in you?
28:16
Apply at y combinator.com/apply. It's never too early and filling out the
28:21
app will level up your idea. Okay, back to the video. Should we do one more? Let's do it. Here's another one.
Design Review: Sytex
28:27
All right, we got Sciteex. Accelerate field infrastructure operations.
28:33
Plan the process, execute in the field, and turn every action into one living knowledge base that you can monitor, automate, and just ask. Okay. I mean,
28:41
right away the first thing I notic is same super bold headline. [laughter] Uh, just like you were talking about, um,
28:48
we've got some of those glows. The colors feel vibe coded. A lot of purple again.
28:54
Um, you know, tends to be another tell. Um, the animation here looks cool. It's kind of like showing how the product
29:00
works. I love that. That's great. Yeah, that gets my attention. Yeah. Also, I had no idea what it was until we got to the animation.
29:06
Yeah. I still am not quite sure but uh yeah it's something that looks like a cananban board I guess.
29:11
Yeah and I I'm getting the sense that I can have my information in such a way that I can monitor it more easily and
29:17
then I I think I would the my feedback here for design is actually make it more clear what I'm getting out of it as a
29:23
user. Um well it's interesting because then they've got this this image down here
29:28
this video that's playing. It's showing construction trucks and somebody with a hard hat on working on their phone and
29:35
uh you go back up and it's like the field operations or yeah field infrastructure operations and then it's
29:41
like okay this is something with managing operations for involving construction or heavy machinery or
29:46
something like that. Um, but it's not obvious above the fold here. No, because that that biggest clue right there is
29:52
right below the fold. And I would love to see too like what is it actually doing? Because I can I have AI enabled combon boards already. So
29:59
what what does what is making it special for construction? I would love to see that as as part of the value prop above.
30:04
But to your point on on some of the fundamentals like very, you know, the bold is here. Um, this looks like it
30:10
maybe an AI created some of it. Here's another great section. So, here's one that would be cleaned up a lot by having
30:16
fewer text styles. So, you see like, you know, one size, two sizes, three sizes,
30:21
four sizes. That's probably another one, too. Um, if you take that down to three, it's going to look so much better. So, let's just try that real quick. Um, and
30:28
I can I'll even ask the agent to do it for us. And again, I use paper snapshot to grab it from the live site, paste it
30:33
into paper as editable layers. Um, and then we'll just say, uh, let me just name this one. Here's another way you
30:39
can do it. You can say, uh, what was the is citex?
30:45
Um this one we'll give to cursor. We'll say hey cursor please clean up the citex
30:51
frame using at most three font sizes and no bold everything regular or below in
30:58
weight. And so you named that frame sciteex and then you just gave it that context clue to the agent.
31:04
Exactly. Just different ways to kind of tell it what you want it to work on. You know my favorite is actually leaving
31:09
comments. Um, and I the thing with the selection I noticed earlier as I was jumping around,
31:14
you tend to change your selection a lot and I'll accidentally like deselect. So I love leaving comments. I think it's just the best way to do things. But here
31:21
we go. So it's starting to work on this one and it's going to align just, you know, bring bring back some of that vibe coded stuff. Now in
31:27
paper we actually give instructions to the model not to do these these common mistakes and and sometimes people go
31:33
like what's your secret sauce? Like how why is it better? Why does it look better? It's just like honestly all we're doing is these basic rules of
31:38
typography and contrast and we had the more senior designers on the team like distill their knowledge into the
31:44
instructions for the model. Yeah, even that is is very powerful though. Just putting those guard rails up around what the models are doing can
31:51
just save a lot of time and energy. Yeah, like an expert, you know, kind of guiding the model a little bit is is
31:58
really helpful. In real life, I might have just done this by hand because it would be faster, but if you had an entire site that you wanted to go through, for instance, using the agent
32:04
is really useful. Or if you wanted to pull this back into your codebase when you're done, um the agent can do that
32:09
for you. This already looks like a huge improvement. Yeah, I think very simple changes, right? All we did was pull back the
32:15
weight of the font and we consolidated how many sizes there are. To me, it looks much more designed and more
32:20
intentional. And so if we go pull the original again, like, you know, here's here's kind of the
32:25
we'll pull up paper and do a side by side. Um now, and this is this is subjective, right? And I know um somebody probably
32:32
spent some time on this design and I think they nailed the content, but by pulling some of these AI tells out of
32:37
it, to me the the one on the right feels more trustworthy. It feels more intentional and more designed.
The biggest tells of AI-generated design
32:42
It's interesting you talk about some of those AI tells. Yeah. What are some of the most common ones you've seen? What are the clues when you
32:48
look at a page or you look at a design and you go, "Somebody just spit out whatever the model spit out and called
32:54
it good and moved on." One, I don't think you should do that. And it's so tempting as especially I'm sure if you're like a YC founder and you
33:00
have zero time and you're trying to sell your first, you know, make your first sales, it's probably very tempting to use whatever cloud design spits out.
33:07
I don't think you should do it because I I don't think it helps you stand out from the crowd. I think it makes you look like one of a million other projects and it makes you look less
33:13
intentional and less like less like you care. And so I think design is this great differentiator. And if you look at
33:19
every great company of the last 10 20 years, like basically all of them have exceptional design, you know, and I
33:25
think that there's I can't think of an example that doesn't, you know, and so I think if you want to be one of those really great companies, you have to put
33:30
the car in on design and and make sure that you stand out. So AI tells, you know, we talked about the font weight,
33:36
the font sizes. Those are huge ones to me. YC's Next Batch is now taking applications. Got a startup in you?
33:42
Apply at y combinator.com/apply. It's never too early and filling out the
33:47
app will level up your idea. Okay, back to the video. You've probably seen the um the side the
33:53
little side swoop of color, like two pixels of color on every card, overusing cards in general, just 20 cards all over
34:00
the place. Now, these are very easy things to correct, too. Just ask the agent, ask paper to create 20 variations
34:05
of that layout, and then pick your favorite one because it's going to look a lot more thoughtful than just a bunch of cards um all over the place. What are
34:12
some of your Do do you have other examples of purple? Oh, purple. Yeah. A lot of gradients, a lot of icons and
34:19
um all caps, like tiny headers. Oh, the tiny headers. Yeah. You know what? A lot of it turns
34:24
out to be widgets for widgets sake. You know, it's it's not something that's actually trying to communicate something
34:30
important or valuable to help a user understand what the design is trying to
34:35
communicate. It's just there to fill up space is what a lot of it feels like. It's like an insecure designer. The
34:41
agents are very insecure. You want to like fill it out and there's like lots of little ones and twos. Yes. Exactly. Like why do you need that?
34:46
Well, I don't know. It looks like it anchors the corners on all those cards better or something, but like does it actually communicate anything? Do those
34:53
numbers mean something? No, they don't. Well, we should just get rid of them then. Totally. Totally. I think a lot of design is deleting. You know, it's like
34:59
it's it's kind of nice to overbuild and then pull it back. Um, but a lot of avoiding the agent look is pulling back.
35:04
It's hard when you know the model spits something out and then you've got to go in and edit it and you have to say, "Oh,
35:11
that headline and describe it and all this stuff versus when you can just go in and select it, hit the delete button
35:17
and everything snaps into place." It feels like you have so much more control and the effort required to get it to a
35:23
more thoughtful place is way way way less. And that I think is incredibly powerful that that doesn't uh force
35:30
people to compromise on speed, but they can still get something that looks really really great and stands out and
35:36
doesn't feel like the models just spit it out. Sometimes we think about this as the best tool for the job and sometimes it's
35:42
prompting and sometimes it's dragging, you know, and and some you don't want to use the wrong one. That's that's no
35:47
good, right? So every vibecoded app has light mode and dark mode [laughter] and
35:52
it's the kind of thing all MVPs all first you know it's like nobody would ever build that as like the first
35:59
feature that they want to launch right it's just that you get it for free and the models love to do it and so that's
36:05
why everybody has that but rarely is it the thing that you know is worth spending time on or including in your
36:11
design and so that's one of the big tells as well and is it actually good you know I think a bad dark mode is another another big
36:16
tell right where it's like It's literally using black instead of, you know, or just reversing the colors or things like this. Yeah. So, so Wes had a
36:23
great tweet recently showing the four the four horsemen of the apocalypse, which is the uh Yeah, you I mean, we talked about this.
36:28
Yeah, that's probably just delete that if you have that. Get rid of that. You don't need it. This one, the all uppercase
36:34
little kickers. Uh probably don't need that with the extra letter spacing in between. Totally. Yeah. This was like me when I
36:41
was learning design when I was 14 years old. I was like, "Yeah, space the stuff out so it looks great." Yeah, this is a good one. the badges with the extra
36:48
little icons. A lot of pills, a lot of icons. Yeah. And and you know, and of course the purple gradient. Yeah. You know,
36:54
line linear made this style great and then I think it got encoded into the models for the next, you know. Yeah. I that's one of the things that's
37:01
interesting is in isolation these things are not bad. It's just when they're overused and you
37:07
see it all the time to your point, it doesn't stand out. Yeah. And it looks sloppy. Design is always
37:13
evolving. The standards are always evolving. the baseline is always evolving and you always have to be stay
37:19
ahead of that otherwise you know you just you look like an average thing and the average thing is not exceptional and that's not
37:26
something people are excited to use and I think it's hard to build a great company if you have a mediocre presentation to the world even impact
37:33
who you hire and who's attracted to your company for recruiting or the talent you can you know attract so it's worth being
37:38
intentional all right let's take a look at uh Moretta here pay like a local via QR codes a global wallet that unlocks local
Design Review: Moreta
37:45
QR payments across Asia and Latin America. Um, okay. So, we've got a bunch
37:50
of flags which I think indicates um lots of countries. Um, it's a payments thing
37:58
and I get a little nervous. A payments thing that looks vibe coded. Yeah.
38:04
Again, the the credibility of your brand is really important, especially if you're dealing with finances. Um, here's
38:10
another example of like pull up the content, you know, get your good content above the fold. I kind of like the energy of this site,
38:17
even though some of it is a little it's a little too wild. It's a little too all over the place. It's sloppy, but I can
38:22
tell it has this like it's trying to suggest this this global feeling, which I think is really cool. Um,
38:28
before Oh, I love this how it works. Get that up, too. You know, I had to scroll pretty far to get there. Um,
38:33
and this just looks a lot cleaner, more professional, also. It does, which makes me trust it more.
38:38
Absolutely. So before uh I I ran this one through paper real quick before we came on just to all I asked it was
38:44
actually to pull back and just just create create a a foundation for this site that is a little more professional and a little more trustworthy. And we
38:50
used 5.5 on this and this is kind of what it came up with. And I actually think in this case um it
38:56
lost a little of the excitement of the original design but that's where you're in a design tool and now you can come in and bring that back yourself.
39:03
But I do think this gives you a little bit more of a foundation. Again, way too much text. Pull back on some of these things.
39:08
Um, but I think it gives you a little bit more of a foundation. And again, you can come in, delete some of the vibe coded stuff. Less is less is more.
39:15
That's what I would try to do with this site is is keep the excitement. Um, keep this kind of like international feeling.
39:20
I like that. It's it's unique, but uh you can't go so far, you know, maybe this text gradient is a little too wild
39:26
and and doesn't feel super trustworthy. But I do I do like the the value prop and I understand what it is for the most
39:33
part pretty quickly which I like. I like that they've got a QR code in the bottom right which is part of the product, right?
39:38
It's like Yeah. Yeah. Which is cool. That's something that I I haven't seen very much before. It makes me want to interact with it.
39:45
It's inviting. Yeah. The overall feeling, the vibe is if we can make it a little more trustworthy. Uh but I like the
39:50
excitement. I like the energy. I like the invitation that I have. Yeah. It's almost too easy to miss it down in that corner though, too, cuz you
39:56
know, you're so used to seeing the chat with us box down and you just assume there's a bunch of things that you should ignore [laughter]
40:02
unless you have a problem. Like that's where you look and I don't know, maybe they should bring that QR code up to the main area and say try it now in the
40:09
hero. Yeah. Yeah, I do. I feel like this hero could be working a lot harder for them cuz when when I start getting down here, I'm like yeah, this is this is
40:16
solid. It seems to get more trustworthy the further you go. Mhm. Yeah. It it is interesting your
40:21
point that you know at the end of the day the models are the ones that are generating the design um when you use
40:27
them to generate the design and you're kind of at the mercy for how like what
40:32
they've been trained on and how they like to design. Yes. Yeah. And so what's important is using the
40:38
right models and the those models getting better at design which will inevitably happen over time and then the
40:44
next thing that you need is just more control over it quickly. Yeah. And so to have that control to be
40:50
able to edit it and make it more in your own vision is actually the really powerful missing piece here that I think
40:56
is is a lot of what paper is providing right here. The agents can speed you up. They can save you a lot of work and they can do
41:02
tasks like translation or resizing for you, but we're a big believer in the human element of design and and how
41:08
important that is. And so we're trying to create a tool that lets humans work really fast with agents. Do you think uh the agents can learn
Can AI learn taste?
41:14
taste in the same [laughter] way that a human can? They'll get better at things like letter space. The little tactical
41:20
things will get better. Yeah. Um over time. And I think what I'm encouraged by is a model like Fable
41:26
seems much more thoughtful. It feels like it actually put some cho some thought into its decisions compared
41:31
to previous models. Um and so I think that is a piece of design is that thoughtfulness. Yeah. Uh now do I ever think it's going to
41:38
replace a human making these design decisions? No. No way. Um because a lot of design is actually a very human task
41:44
of like decision-m in an organization. It's showing people comps and being and people can be like, "Oh, not like that.
41:50
I don't like that." The role of design is is you see the pixels at the end, but the role of design in an org is like
41:55
decisions and and stakeholders and bringing in requirements and problem space. And those are not things that
42:01
agents are have any skill at really. You know, who knows over time they're going to get smarter and smarter and smarter. But I just think humans are just such an
42:07
essential piece of building stuff that stands out, right, from the crowd. Yeah, it's interesting. I I was having a
42:12
very similar conversation with someone who leads design at a multi-billion dollar design forward company um about
42:20
there's a thought process that goes through a human's head where they're reacting to something and a criteria
42:26
they're evaluating and it's very um implicit for us as humans right now. And
42:31
the question is, can you verbalize what those things are? Like what is [clears throat] the process
42:37
of you deciding whether something is good or not or looks good or not or very subjective
42:42
hits the bar or not? Can you literally go through and quantify all of that and
42:47
teach that to a model to the point where it has taste like a human would? And then the question becomes, well, if
42:53
all the models were able to do that, does everything just look the same again? [laughter] And then you always need the humans to be drive to finding
43:00
the next thing that's actually going to be new and stands out and and pushes the limits more.
43:05
We see that even within human pre premodels as trends take over, you know, and everyone kind of looks like linear for a couple years and then somebody
43:11
else figures out something, right? I do think the models will get good at tactics. Um they'll get better at not making everything bold. Um you know, and
43:18
I think that that's great and that'll be really that'll be really nice. But the just the thought the product there's so much of design again it's like was this
43:24
showing value prop or not? that stuff's more important. This site, for instance, that I think is a little too wild, maybe
43:30
it's really important for them to be really fun and exciting. Maybe that's what their market needs, you know, and so maybe it's a higher order thing for
43:36
them to be very exciting. And can a model make that decision? Can, you know, maybe with enough information you could
43:42
start to get there, but I think we're pretty far away from that. You know, maybe 10 years, something like that. May
43:48
I don't know, maybe I'm too pessimistic. Maybe it'll come sooner. But I I still see humans as just this essential piece of the of the puzzle.
43:53
Yeah, we certainly hope so. Yeah, let's hope [laughter] so. I'm curious how how are you guys using agents internally at paper?
How Paper uses agents internally
43:59
In some ways we use them a lot and then in other ways we use them we're kind of like dinosaurs in some ways like like we don't have agents in our Slack and we
44:05
don't have um we use agents for coding quite a bit but we still read our code. We read all of our code every single line.
44:10
Usually multiple humans reads every single line. Why is that? Well, one is design tools are really hard to build. Um you know you can't
44:16
vibe code a design tool at the level of a Figma today. Maybe you can eventually. Um and so it takes a lot of a lot of
44:22
really precise really careful work. It's very multi-dimensional in terms of the systems. And so we just have to be really careful and we want to make sure
44:27
our experience, you know, designers need 120 FPS. It needs to be fast. It needs to work every single time. Um, and the
44:34
agents just aren't there for that yet. The other thing is a small elite team, right? So 12 people, keep the talent bar
44:39
extremely high. I think when you're building companies, that's how you should try to do it these days. Uh, and use the agents to accelerate the the
44:45
people. Um, but if you have less people, you have less communication burden. You have less of these other costs uh to go
44:50
through. One example of how we use agents though is is Au, our brand designer. He's a brilliant brand designer, great at visuals. Um, he codes
44:57
a little bit, but like I don't think he'd call himself like a programmer. And he made our entire website uh in about a
45:02
week before this last launch, including shipping it, including all of the animations. And he designed everything in paper. And
45:08
this is the kind of design you wouldn't want to do this with prompting, right? You need this uh he has his shaders in
45:14
the background subtly coming through these motifs. He did everything in paper and then he just prompted. And this was, you know,
45:20
six months ago now, so different models. Um, he just prompted the animations on top of his of his paper file. And it's
45:25
like, you know, take take my paper designs, turn it into a codebase. This is an next.js site. Um, and put it together for me. No one else looked at
45:32
this. Uh, so Agu did this end to end in a week because he's a designer. He puts in these Easter eggs. There's little like fun extras
45:38
and it's all just interactive. It's interactive. And this is something he would not have done. He wouldn't have had the time. I'm sure he could have,
45:44
you know, skill-wise he could have got there, but like he wouldn't had the time to do this. Um, so I think that's really really cool and and so I think a lot of
45:50
times it shows up more not in our core product where we're actually pretty human based still uh for precision
45:56
reasons but in all the other stuff all the videos we need to make all the marketing site all of that other stuff where we can you know have agents help
46:02
us um help people go faster. So we do yeah quite a bit of that and then of course the coding agents you
46:08
know we we do use uh cursor extensively we use cloud code extensively uh we use bugbot for our PR reviews which has been
46:14
really helpful. It's a little too pedantic, but it still catches catches bugs, which is good. There's a little bit of a FOMO right now with agents
46:21
where it's like, oh, every
46:27
we are kind of taking the approach that quality software takes time. And we have competitors that have every
46:33
single feature, but they don't have the attention or people don't care. And for whatever reason, whatever that is, it's like
46:38
people want paper to be better. They don't want the competitors that have every single feature to be better. Mhm. And I think that it's because we care
46:44
and we're putting in that precision, that care about these things. So even if we're moving a little slower, uh people still care more about it. And so I think
46:50
that quality matters still thankfully. My sense from talking to a lot of designers is that you guys are almost
Building a community around Paper
46:55
building kind of a ground swell movement, like a cult movement of people
47:02
that are now using paper as the new cool thing that a lot of designers are using and it's it's the new modern way to
47:08
work. Was that intentional? And what are the things that you're doing to try to
47:13
get more users, to grow, to get some mind share? Like you seem to be one of the only companies Figma obviously has
47:20
built this huge behemoth and gone public and you know all the Fortune 500 uses them and and all this stuff, but it
47:27
feels like you've started to to crack some of that um certainly within certain user types. And how have you gone about
47:34
doing that and and what's been most successful for you there? Yeah, a huge part of that is is like being very values aligned with the market. Um, we
47:41
we didn't have a product for the first year and we still got to about 25,000 Twitter followers just by talking about our values. You just I'd go on podcast
47:48
be like, I really like design. Do you like design? Then we get into the topic and talk about typography or whatever. Being values aligned with your market.
47:54
They will forgive so much about your product missing things. They'll wait for them to come out. They'll root for you
48:00
if they can tell you're authentic, you know. And if you're building design software, it really matters. It really
48:05
matters. Maybe not for all software, but for design software, usually best product, most authentic product wins. And so I think for us it was it's just,
48:12
you know, again, company of 12 designer and engineers and just live our values and and people really resonate with that. And by the way, the product is
48:18
really good, too. I think that that part's important. You got to get there. Um, but you know, I think that's that's part of it. And then there's a market
48:24
clock. Every company, hopefully we have this problem someday. Every company eventually goes up market and you just stop being as cool when you do that. You
48:30
know, you're selling to enterprises. You're not you're not underground at the cool events, you know, anymore. So um I I I'm really honored that we are part of
48:37
the community and to your point like I think you saw you know ramp has been releasing the the data of actual ramp
48:42
subscriptions on their credit cards and if they released an AI you can chat with uh about the ramp data and if you
48:48
ask it about design tools uh it's you know Figma obviously um sketch is there and then paper is is right there with
48:53
sketch and so we're the first company since Figma's come out to like make a dent in that market at all you know and it's growing very quickly um which is
48:59
really encouraging it's really exciting because you don't know when you start a company like how it's going to go you no idea like I said there months where I
49:04
was like, "Nobody's going to care about this." [laughter] And to now have like so many cool people, people are way cooler than me that care a lot about
49:10
paper and are like wearing our merch and stuff. It's like so much fun to see. And uh honestly, it's the best part. That's very cool. And this is not your
Lessons from Steven’s first startup
49:17
first company. This is your second company, right? And um it seems like even before you had a product, you have
49:23
gotten yourself out there and your vision and your values and you become the ambassador and that's what people
49:29
were buying in to before you had a product and certainly in the early days of of having a product and that's what's
49:34
been successful is you um and getting that out there and how is that different from you you know you
49:40
built another company before this and like contrast the the two. Well, so my first company modules was working on
49:46
designer developer handoff and we built radics UI along the way. It was like one of our side projects that just kept going and you know Redix became this
49:53
default react component library. One was this was pre- AI so you know everything was harder designer developer
49:59
handoff was harder. two was we really listened to both sides at once and we got very confused because designers want
50:04
engineers to change and engineers want designers to change and like they will tell you the other team will use your software like you can't build software
50:10
that way and so we learned some hard lessons about making something people actually want uh and then I think I've been able to apply uh at paper
50:17
but we did make I mean the radics has amazing product market fit we just didn't see a way to build like a venture scale business around it and so we
50:23
thought let's let's just make it free and give it away and then you know come back uh with something next time and um
50:28
so that's been cool I that that worked out really well. Uh we sold this company to work OS which is an amazing author identity company. We use work OS um for
50:35
paper and then a couple years after that I just wanted to start back into creative tooling again.
50:40
And are there any lessons that you took from that experience that you're applying this time? You can way over complicate product
50:46
building. You know the make something people want is a great phrase and really a lot of times when with your product
50:52
it's like what does my company need next? What would be like the best thing that's possibly could happen in my company right now? At the beginning for
50:58
us that was like being part of the conversation having Twitter followers. Well, let's go do things that get Twitter followers. Let's go on a
51:04
podcast. Let's talk to users and then represent their values outwardsly. So, you know, a lot of times it's actually
51:09
very simple. Uh, and I think we make it too complicated and we're trying to have these brilliant strategies for our
51:14
companies and it's like what do you need next? And just do the most straightforward thing you can possibly do to get there. And, you know, and and
51:20
don't be scared to do things that sound hard. You know, obviously you got to got to do them. So, that's a philosophy we've taken. Uh bottlenecks first huge
51:27
huge philosophy I really believe in. Like for us right now the bottleneck is early adopters are using paper. Um the
51:33
people that are more you know maybe not an early adopter type are very used to what they're doing now and they're
51:38
missing features like comments and components and so now our bottleneck is actually features again. And so now it's
51:44
like that's what we got to go do next and and release that bottle bottleneck to the business. Another just like a tactical thing is just like talking to
51:50
users every day. It's so so important. Um, I had a rule the first year of the company I had to talk to a designer every single day and I did it all the
51:56
way through the year. Um, and I that was so useful because I learned just how like when you when you start making the
52:02
company and the product, you just have a different perspective. You can't help it. You have cursive knowledge and so just staying rooted in user u user
52:08
conversations is really important. Yeah, it gets harder and harder to do that as the company grows and scales
52:13
also because there's so many other things that are vying for your time and pulling you in different directions and
52:18
that seem important um or hair on fire in the moment. Yeah, but really it's those core fundamental things of build your product, talk to
52:24
users, and you know, exercise or whatever you need to do so you don't go crazy doing the first two things. But
52:30
that's the core of it for the life of the company, right? And and that's it. And so it's cool to hear that you've
52:35
done that from the very first day and I'm sure it is something that has been
52:41
uh instilled culturally in your team now and that everybody is talking to users at this point.
52:46
Oh yeah. Yeah. That's when people on board it's like you Yeah. you have to be in the Discord talking to to people or in the Slack.
52:52
Uh it's really really important and not everyone's comfortable. Maybe they've come from a bigger company where they were told they can't talk to users and
52:58
you know it's like no get in there. You can't screw it up and you just you just learn so much and I think it guides your decision-m you decisions are really
53:04
important uh in a company. You can kind of look at like successful companies of like you can trace their decisions backwards in time of like oh that was an
53:11
inflection point that decision was really good. Um, and so I think having an informed employee base, like I can't
53:17
make every decision in the company. Even at 12 people, there's no way I could do that. And so if you can have your employees be really informed about users
53:23
and and what they actually want, um, you'll have good decisions being made all over, you know, all all over the
53:28
place. And I Yeah, it's really important. What do you think is next for design? Well, I think a lot of design isn't changing. again in orgs it's like the
What’s next for design and Paper
53:35
function of design is still really important um as a as a way to explore problem space competitive analysis
53:41
executive uh you know stakeholders things like this um we're not seeing that change at all and so you know that
53:47
function of design I think is is sticking around um if anything I think we're going to see more because there are more companies and there's more
53:53
software to be made um so we're seeing just more and more design need uh in the world
53:58
I do think the tooling is going to accelerate because I think we just need to be able to keep the quality bar up at
54:05
a pace um that is you know keeping up with the engineering with the product teams um the software will ship whether
54:12
the designer gets a chance to make it better or not. This is kind of like a reality of of uh the competitive landscape. So how do we help make sure
54:18
that the designer can be part of the conversation and keep up in that in that shipping process. Um but you know I
54:24
think in general uh sometimes I think there's less change coming than people people think actually. Um because I think that a lot
54:30
of design is a very human problem and the the pixels at the end are like the output of the process, you know. Yeah.
54:36
It's the medium at the end of the day, right? Exactly. Yeah. Yeah. And what's next for paper? Well, so we are like I said, we're
54:42
building out some table stakes, components, comments, bottleneck reducers. Um I'm really excited. Something I've learned from talking to
54:47
users is people are building all these prototypes all over the place and they're they're ending up on Versel or
54:54
their HTML files and people don't know how to leave feedback onto them, how to even find which one someone's talking
54:59
about. So, what we're going to do is we're going to put uh basically you can like eye if things onto the paper canvas has a place to keep your prototypes uh
55:05
kind of like organized and then people can leave comments as they're used to doing on the on the prototypes. So, when
55:11
people ask us if we're doing prototyping, it's like, well, kind of. We're gonna help you organize your prototypes and and have feedback cycles.
55:16
And I think this is gonna be a really big unlock for companies that are um you know, building playgrounds for their
55:22
designers to vibe code in, but then there's kind of like this messy result uh and they need some tool to help them
55:27
organize that. So, that's a big thing we're going to be working on the next, you know, 6 months or so uh as we're building out the table stakes that that
55:34
people expect to. Amazing. Stephen, thank you so much for coming on and sharing paper with us and
55:39
uh all of your design insight that I know has been uh hardearned over the years and the companies that you've built and and the incredible places
55:45
you've worked. So, thank you. Yeah, thank you so much for having me. That does it for this episode of Design Review and we'll see you on the next
55:50
one.




