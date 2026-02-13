function normalizeLine(rawLine) {
  const noInlineComment = rawLine.replace(/\s*\/\/.*$/, '').replace(/\s+#.*$/, '')
  return noInlineComment.trim()
}

function ensureClass(classMap, name) {
  if (!classMap[name]) {
    classMap[name] = {
      id: name,
      name,
      attributes: [],
      methods: [],
    }
  }
  return classMap[name]
}

function addClassMember(targetClass, memberLine) {
  const member = memberLine.trim()
  if (!member) {
    return
  }
  if (member.includes('(') && member.includes(')')) {
    targetClass.methods.push(member)
  } else {
    targetClass.attributes.push(member)
  }
}

function parseClassRelation(line) {
  const relationMatch = line.match(
    /^([A-Za-z0-9_\u0600-\u06FF]+)\s*(<\|--|\*--|o--|--)\s*([A-Za-z0-9_\u0600-\u06FF]+)$/,
  )
  if (!relationMatch) {
    return null
  }

  const [, left, token, right] = relationMatch
  if (token === '<|--') {
    return {
      from: right,
      to: left,
      relationType: 'inheritance',
      markerStart: null,
      markerEnd: 'triangle',
    }
  }
  if (token === '*--') {
    return {
      from: left,
      to: right,
      relationType: 'composition',
      markerStart: 'diamond',
      markerEnd: null,
    }
  }
  if (token === 'o--') {
    return {
      from: left,
      to: right,
      relationType: 'aggregation',
      markerStart: 'hollow-diamond',
      markerEnd: null,
    }
  }

  return {
    from: left,
    to: right,
    relationType: 'association',
    markerStart: null,
    markerEnd: null,
  }
}

function resolveDiagramType(diagrams) {
  const scoreMap = {
    usecase: diagrams.useCase.associations.length,
    sequence: diagrams.sequence.messages.length + diagrams.sequence.activations.length,
    class:
      diagrams.class.classes.length * 2 +
      diagrams.class.relations.length +
      diagrams.class.classes.reduce(
        (sum, item) => sum + item.attributes.length + item.methods.length,
        0,
      ),
    state: diagrams.state.transitions.length,
  }

  const detectedTypes = Object.entries(scoreMap)
    .filter(([, score]) => score > 0)
    .map(([type]) => type)

  if (!detectedTypes.length) {
    return { type: 'unknown', detectedTypes: [] }
  }

  const sorted = Object.entries(scoreMap).sort((a, b) => b[1] - a[1])
  const [topType, topScore] = sorted[0]
  const secondScore = sorted[1]?.[1] ?? 0

  if (topScore > 0 && secondScore === topScore) {
    return { type: 'mixed', detectedTypes }
  }

  return { type: topType, detectedTypes }
}

export function parseDiagramText(input = '') {
  const lines = input.split('\n')

  const actorMap = {}
  const useCaseMap = {}
  const participantsMap = {}
  const classMap = {}
  const stateMap = {}

  const useCaseAssociations = []
  const sequenceMessages = []
  const classRelations = []
  const stateTransitions = []

  const sequenceCommands = []
  const activationStacks = {}
  const activationIntervals = []

  const errors = []
  let openClassName = null

  for (let lineNumber = 0; lineNumber < lines.length; lineNumber += 1) {
    const line = normalizeLine(lines[lineNumber])
    if (!line) {
      continue
    }

    if (openClassName) {
      const closingBracketIndex = line.indexOf('}')
      if (closingBracketIndex >= 0) {
        const beforeClosing = line.slice(0, closingBracketIndex).trim()
        if (beforeClosing) {
          addClassMember(ensureClass(classMap, openClassName), beforeClosing)
        }
        openClassName = null
      } else {
        addClassMember(ensureClass(classMap, openClassName), line)
      }
      continue
    }

    const classSingleLine = line.match(/^class\s+([A-Za-z0-9_\u0600-\u06FF]+)\s*\{(.*)\}$/)
    if (classSingleLine) {
      const [, className, body] = classSingleLine
      const targetClass = ensureClass(classMap, className)
      const members = body
        .split(';')
        .map((part) => part.trim())
        .filter(Boolean)
      members.forEach((member) => addClassMember(targetClass, member))
      continue
    }

    const classStart = line.match(/^class\s+([A-Za-z0-9_\u0600-\u06FF]+)\s*\{$/)
    if (classStart) {
      const [, className] = classStart
      ensureClass(classMap, className)
      openClassName = className
      continue
    }

    const classRelation = parseClassRelation(line)
    if (classRelation) {
      ensureClass(classMap, classRelation.from)
      ensureClass(classMap, classRelation.to)
      classRelations.push({
        id: `class-relation-${classRelations.length + 1}`,
        ...classRelation,
      })
      continue
    }

    const activationCommand = line.match(/^(activate|deactivate)\s+(.+)$/i)
    if (activationCommand) {
      const [, command, participantNameRaw] = activationCommand
      const participantName = participantNameRaw.trim()
      participantsMap[participantName] = {
        id: participantName,
        name: participantName,
      }

      sequenceCommands.push({
        id: `seq-command-${sequenceCommands.length + 1}`,
        command: command.toLowerCase(),
        participant: participantName,
        atMessageIndex: sequenceMessages.length,
      })

      if (command.toLowerCase() === 'activate') {
        if (!activationStacks[participantName]) {
          activationStacks[participantName] = []
        }
        activationStacks[participantName].push(sequenceMessages.length)
      } else {
        const stack = activationStacks[participantName]
        const startIndex = stack?.pop()
        if (startIndex === undefined) {
          errors.push(
            `Line ${lineNumber + 1}: deactivate without matching activate for "${participantName}".`,
          )
        } else {
          activationIntervals.push({
            id: `activation-${activationIntervals.length + 1}`,
            participant: participantName,
            startIndex,
            endIndex: sequenceMessages.length,
          })
        }
      }
      continue
    }

    const useCaseMatch = line.match(/^(.+?)\s*--?>\s*\((.+?)\)$/)
    if (useCaseMatch) {
      const [, actorRaw, useCaseRaw] = useCaseMatch
      const actor = actorRaw.trim()
      const useCase = useCaseRaw.trim()

      actorMap[actor] = { id: actor, name: actor }
      useCaseMap[useCase] = { id: useCase, name: useCase }
      useCaseAssociations.push({
        id: `usecase-association-${useCaseAssociations.length + 1}`,
        actorId: actor,
        useCaseId: useCase,
        async: line.includes('-->'),
      })
      continue
    }

    const stateMatch = line.match(/^\[(.+?)\]\s*--?>\s*\[(.+?)\](?:\s*:\s*(.+))?$/)
    if (stateMatch) {
      const [, fromRaw, toRaw, labelRaw] = stateMatch
      const from = fromRaw.trim()
      const to = toRaw.trim()
      const label = labelRaw?.trim() ?? ''

      if (from !== '*') {
        stateMap[from] = { id: from, name: from }
      }
      if (to !== '*') {
        stateMap[to] = { id: to, name: to }
      }

      stateTransitions.push({
        id: `state-transition-${stateTransitions.length + 1}`,
        from,
        to,
        label,
        async: line.includes('-->'),
      })
      continue
    }

    const sequenceMatch = line.match(/^(.+?)\s*(--?>)\s*(.+?)\s*:\s*(.+)$/)
    if (sequenceMatch) {
      const [, fromRaw, arrowToken, toRaw, labelRaw] = sequenceMatch
      const from = fromRaw.trim()
      const to = toRaw.trim()
      const label = labelRaw.trim()

      participantsMap[from] = { id: from, name: from }
      participantsMap[to] = { id: to, name: to }

      sequenceMessages.push({
        id: `sequence-message-${sequenceMessages.length + 1}`,
        from,
        to,
        message: label,
        messageType: arrowToken === '-->' ? 'async' : 'sync',
      })
      continue
    }

    errors.push(`Line ${lineNumber + 1}: could not parse "${line}".`)
  }

  if (openClassName) {
    errors.push(`Unclosed class block for "${openClassName}".`)
  }

  for (const [participant, stack] of Object.entries(activationStacks)) {
    for (const startIndex of stack) {
      activationIntervals.push({
        id: `activation-${activationIntervals.length + 1}`,
        participant,
        startIndex,
        endIndex: sequenceMessages.length,
      })
    }
  }

  const diagrams = {
    useCase: {
      actors: Object.values(actorMap),
      useCases: Object.values(useCaseMap),
      associations: useCaseAssociations,
    },
    sequence: {
      participants: Object.values(participantsMap),
      messages: sequenceMessages,
      activations: activationIntervals,
      commands: sequenceCommands,
    },
    class: {
      classes: Object.values(classMap),
      relations: classRelations,
    },
    state: {
      states: Object.values(stateMap),
      transitions: stateTransitions,
    },
  }

  const { type, detectedTypes } = resolveDiagramType(diagrams)

  return {
    type,
    detectedTypes,
    diagrams,
    errors,
  }
}
