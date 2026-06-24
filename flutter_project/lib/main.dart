import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:video_player/video_player.dart';
import 'package:chewie/chewie.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:shimmer/shimmer.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

// ==========================================
// 1. DUAL DATABASE LOGISTIC CREDENTIALS
// ==========================================
const String FIREBASE_PROJECT_ID = "ai-studio-applet-webapp-8d448";
const String FIREBASE_FIRESTORE_DB_ID = "ai-studio-a6d78bec-83a7-4e50-81fa-adea4f2894ca";

const String SUPABASE_URL = "https://wvwnpnnqijtgupxtodug.supabase.co";
const String SUPABASE_ANON_KEY = "sb_publishable_2tN_SeBb-0gtUGn5BquZoA_K1AP28aX";

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Set immersive dark status bar properties
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
    systemNavigationBarColor: Color(0xFF030307),
    systemNavigationBarIconBrightness: Brightness.light,
  ));

  // Initialize Supabase Client
  try {
    await Supabase.initialize(
      url: SUPABASE_URL,
      anonKey: SUPABASE_ANON_KEY,
    );
  } catch (e) {
    debugPrint("Supabase initialization warning: $e");
  }

  // Initialize Firebase (Users should follow Android setup instructions to link google-services.json)
  try {
    // Attempt lazy-initialization to avoid startup crashes if native configurations aren't in place
    await Firebase.initializeApp();
  } catch (e) {
    debugPrint("Firebase initialization skipped (will fallback directly to Supabase primary): $e");
  }

  runApp(const LiveKhelaApp());
}

class LiveKhelaApp extends StatelessWidget {
  const LiveKhelaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'LiveKhela',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF05050A),
        primaryColor: const Color(0xFF10B981),
        fontFamily: GoogleFonts.inter().fontFamily,
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF10B981),
          secondary: Color(0xFF06B6D4),
          surface: Color(0xFF0D0D15),
          background: Color(0xFF05050A),
        ),
      ),
      home: const MainDashboardScreen(),
    );
  }
}

// ==========================================
// DATA MODELS REPRESENTATIONS
// ==========================================
class MatchModel {
  final String id;
  final String title;
  final String category;
  final String status; // LIVE, UPCOMING, ENDED
  final String team1Name;
  final String team1Logo;
  final String team2Name;
  final String team2Logo;
  final String channelId;
  final String time;

  MatchModel({
    required this.id,
    required this.title,
    required this.category,
    required this.status,
    required this.team1Name,
    required this.team1Logo,
    required this.team2Name,
    required this.team2Logo,
    required this.channelId,
    required this.time,
  });

  factory MatchModel.fromMap(Map<String, dynamic> data, String docId) {
    return MatchModel(
      id: docId,
      title: data['title'] ?? data['name'] ?? 'খেলা',
      category: data['category'] ?? 'Sports',
      status: data['status'] ?? 'LIVE',
      team1Name: data['team1Name'] ?? 'Team A',
      team1Logo: data['team1Logo'] ?? '',
      team2Name: data['team2Name'] ?? 'Team B',
      team2Logo: data['team2Logo'] ?? '',
      channelId: data['channelId'] ?? '',
      time: data['time'] ?? '',
    );
  }
}

class ChannelModel {
  final String id;
  final String name;
  final String logo;
  final String category;
  final String streamUrl1;
  final String streamUrl2;
  final String streamUrl3;

  ChannelModel({
    required this.id,
    required this.name,
    required this.logo,
    required this.category,
    required this.streamUrl1,
    required this.streamUrl2,
    required this.streamUrl3,
  });

  factory ChannelModel.fromMap(Map<String, dynamic> data, String docId) {
    return ChannelModel(
      id: docId,
      name: data['name'] ?? data['title'] ?? 'লাইভ চ্যানেল',
      logo: data['logo'] ?? '',
      category: data['category'] ?? 'General',
      streamUrl1: data['streamUrl1'] ?? data['url'] ?? '',
      streamUrl2: data['streamUrl2'] ?? data['url2'] ?? '',
      streamUrl3: data['streamUrl3'] ?? data['url3'] ?? '',
    );
  }
}

// ==========================================
// MAIN SCREEN DASHBOARD WITH TABS
// ==========================================
class MainDashboardScreen extends StatefulWidget {
  const MainDashboardScreen({super.key});

  @override
  State<MainDashboardScreen> createState() => _MainDashboardScreenState();
}

class _MainDashboardScreenState extends State<MainDashboardScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<MatchModel> _matches = [];
  List<ChannelModel> _channels = [];
  bool _isLoading = true;
  String _activeDatabaseSource = "সংযুক্ত ডাটাবেজ...";
  Color _sourceColor = Colors.orange;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadAllAppData();
  }

  // Dual-database balancer execution logic
  Future<void> _loadAllAppData() async {
    setState(() {
      _isLoading = true;
    });

    bool successFromFirebase = false;

    // S1: Attempt Firebase Load
    try {
      final firestoreInstance = FirebaseFirestore.instance;
      // Fetch Matches
      final matchesSnap = await firestoreInstance
          .collection('matches')
          .orderBy('time', descending: false)
          .get();
      
      final channelsSnap = await firestoreInstance
          .collection('channels')
          .get();

      List<MatchModel> fetchedMatches = [];
      for (var doc in matchesSnap.docs) {
        fetchedMatches.add(MatchModel.fromMap(doc.data(), doc.id));
      }

      List<ChannelModel> fetchedChannels = [];
      for (var doc in channelsSnap.docs) {
        fetchedChannels.add(ChannelModel.fromMap(doc.data(), doc.id));
      }

      setState(() {
        _matches = fetchedMatches;
        _channels = fetchedChannels;
        _activeDatabaseSource = "FIREBASE SECURE PRIMARY HOST";
        _sourceColor = const Color(0xFF10B981); // Emerald Green
        _isLoading = false;
      });
      successFromFirebase = true;
    } catch (e) {
      debugPrint("S1 Firebase loader warning: $e. Transitioning to S2 Supabase backup...");
    }

    // S2: Supabase Fallback Load
    if (!successFromFirebase) {
      try {
        final supabaseClient = Supabase.instance.client;

        final matchesResponse = await supabaseClient
            .from('matches')
            .select('*');

        final channelsResponse = await supabaseClient
            .from('channels')
            .select('*');

        List<MatchModel> fetchedMatches = [];
        if (matchesResponse != null) {
          for (var row in matchesResponse as List) {
            fetchedMatches.add(MatchModel.fromMap(row as Map<String, dynamic>, row['id']?.toString() ?? ''));
          }
        }

        List<ChannelModel> fetchedChannels = [];
        if (channelsResponse != null) {
          for (var row in channelsResponse as List) {
            fetchedChannels.add(ChannelModel.fromMap(row as Map<String, dynamic>, row['id']?.toString() ?? ''));
          }
        }

        setState(() {
          _matches = fetchedMatches;
          _channels = fetchedChannels;
          _activeDatabaseSource = "SUPABASE LIVE BACKUP ENGINE";
          _sourceColor = const Color(0xFF06B6D4); // Sky Blue
          _isLoading = false;
        });
      } catch (err) {
        debugPrint("S2 Backup database error: $err. Falling back to local state mock values.");
        _loadMockLocalData();
      }
    }
  }

  void _loadMockLocalData() {
    setState(() {
      _matches = [
        MatchModel(
          id: 'm1',
          title: 'আর্জেন্টিনা বনাম ব্রাজিল',
          category: 'ফুটবল',
          status: 'LIVE',
          team1Name: 'Argentina',
          team1Logo: 'https://flagcdn.com/w320/ar.png',
          team2Name: 'Brazil',
          team2Logo: 'https://flagcdn.com/w320/br.png',
          channelId: 'ch1',
          time: 'রাত ১১:০০',
        ),
      ];
      _channels = [
        ChannelModel(
          id: 'ch1',
          name: 'টি স্পোর্টস লাইভ (T Sports)',
          logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRz-8Z4qW9Gz9Htw',
          category: 'ফুটবল',
          streamUrl1: 'https://sample.vodobox.net/skate_phantom_flex_4k/skate_phantom_flex_4k.m3u8',
          streamUrl2: '',
          streamUrl3: '',
        ),
      ];
      _activeDatabaseSource = "LOCAL FAIL-SAFE STORAGE ACTIVATED";
      _sourceColor = Colors.orange;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: const Color(0xFF05050A),
        elevation: 0,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFF10B981).withOpacity(0.1),
                border: Border.all(color: const Color(0xFF10B981).withOpacity(0.2)),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(FontAwesomeIcons.gamepad, color: Color(0xFF10B981), size: 16),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'LIVE KHELA',
                  style: GoogleFonts.spaceGrotesk(
                    fontWeight: FontWeight.extrabold,
                    fontSize: 15,
                    letterSpacing: 1.2,
                    color: Colors.white,
                  ),
                ),
                Text(
                  'HIGH PERFORMANCE APP',
                  style: GoogleFonts.spaceGrotesk(
                    fontWeight: FontWeight.bold,
                    fontSize: 9,
                    letterSpacing: 1.0,
                    color: const Color(0xFF10B981),
                  ),
                ),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            onPressed: () => _loadAllAppData(),
            icon: const Icon(Icons.refresh, color: Colors.white, size: 22),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: Color(0xFF10B981)),
            )
          : RefreshIndicator(
              onRefresh: _loadAllAppData,
              color: const Color(0xFF10B981),
              backgroundColor: const Color(0xFF0D0D15),
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 10),
                      
                      // Active DB status indicator banner
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: _sourceColor.withOpacity(0.06),
                          border: Border.all(color: _sourceColor.withOpacity(0.2)),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Row(
                          children: [
                            Icon(FontAwesomeIcons.shieldHalved, color: _sourceColor, size: 16),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'লাইভ সোর্স স্ট্যাটাস',
                                    style: GoogleFonts.inter(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 10,
                                      color: Colors.white70,
                                    ),
                                  ),
                                  Text(
                                    _activeDatabaseSource,
                                    style: GoogleFonts.spaceGrotesk(
                                      fontWeight: FontWeight.extrabold,
                                      fontSize: 11,
                                      color: _sourceColor,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, py: 4),
                              decoration: BoxDecoration(
                                color: _sourceColor.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Row(
                                children: [
                                  Container(
                                    width: 6,
                                    height: 6,
                                    decoration: BoxDecoration(
                                      color: _sourceColor,
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    'ACTIVE',
                                    style: GoogleFonts.spaceGrotesk(
                                      fontSize: 9,
                                      fontWeight: FontWeight.black,
                                      color: _sourceColor,
                                    ),
                                  ),
                                ],
                              ),
                            )
                          ],
                        ),
                      ),
                      
                      const SizedBox(height: 20),

                      // Navigation Tab selections
                      Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: const Color(0xFF0D0D15),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: Colors.white.withOpacity(0.05)),
                        ),
                        child: TabBar(
                          controller: _tabController,
                          indicator: BoxDecoration(
                            color: const Color(0xFF10B981),
                            borderRadius: BorderRadius.circular(10),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF10B981).withOpacity(0.2),
                                blurRadius: 10,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          indicatorSize: TabBarIndicatorSize.tab,
                          labelColor: Colors.black,
                          unselectedLabelColor: Colors.white60,
                          labelStyle: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 13),
                          tabs: const [
                            Tab(text: '⚽ আজকের খেলা'),
                            Tab(text: '📺 টিভি চ্যানেল'),
                          ],
                        ),
                      ),
                      
                      const SizedBox(height: 20),

                      // Dynamic viewport matching current tab selection
                      SizedBox(
                        height: 520, // Dedicated height container for modular lists
                        child: TabBarView(
                          controller: _tabController,
                          children: [
                            _buildTodayMatchesTab(),
                            _buildChannelsTab(),
                          ],
                        ),
                      ),

                      const SizedBox(height: 20),
                    ],
                  ),
                ),
              ),
            ),
    );
  }

  // Today's matches list builder
  Widget _buildTodayMatchesTab() {
    final liveMatches = _matches.where((m) => m.status == 'LIVE').toList();
    final alternativeMatches = _matches.where((m) => m.status != 'LIVE').toList();

    if (_matches.isEmpty) {
      return Center(
        child: Text(
          'কোনো ম্যাচ তালিকা পাওয়া যায়নি',
          style: GoogleFonts.inter(color: Colors.white38),
        ),
      );
    }

    return ListView(
      physics: const NeverScrollableScrollPhysics(),
      children: [
        if (liveMatches.isNotEmpty) ...[
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'চলতি লাইভ স্ট্রিম',
                style: GoogleFonts.inter(fontWeight: FontWeight.extrabold, fontSize: 13, color: Colors.white),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, py: 3),
                decoration: BoxDecoration(color: Colors.red.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                child: Text(
                  'LIVE NOW',
                  style: GoogleFonts.spaceGrotesk(fontSize: 9, fontWeight: FontWeight.black, color: Colors.redAccent),
                ),
              )
            ],
          ),
          const SizedBox(height: 10),
          ...liveMatches.map((m) => _buildMatchCard(m)),
        ],
        
        const SizedBox(height: 15),
        
        if (alternativeMatches.isNotEmpty) ...[
          Text(
            'আজকের অন্যান্য সময়সূচী',
            style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.white70),
          ),
          const SizedBox(height: 10),
          ...alternativeMatches.map((m) => _buildMatchCard(m)),
        ]
      ],
    );
  }

  // Match item widget builder
  Widget _buildMatchCard(MatchModel match) {
    bool isLive = match.status == 'LIVE';

    return GestureDetector(
      onTap: () {
        // Resolve Target Channel object by database identifier
        final targetChan = _channels.firstWhere(
          (c) => c.id == match.channelId,
          orElse: () => ChannelModel(
            id: match.channelId,
            name: match.title,
            logo: match.team1Logo,
            category: 'Sports',
            streamUrl1: 'https://sample.vodobox.net/skate_phantom_flex_4k/skate_phantom_flex_4k.m3u8',
            streamUrl2: '',
            streamUrl3: '',
          ),
        );
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => LivePlayerScreen(channel: targetChan),
          ),
        );
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFF0D0D15),
          border: Border.all(
            color: isLive ? const Color(0xFF10B981).withOpacity(0.15) : Colors.white.withOpacity(0.04),
          ),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Column(
          children: [
            // Head category and live tag
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  match.category,
                  style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: const Color(0xFF10B981)),
                ),
                if (isLive)
                  Container(
                    width: 8,
                    height: 8,
                    decoration: const BoxDecoration(
                      color: Colors.red,
                      shape: BoxShape.circle,
                    ),
                  )
                else
                  Text(
                    match.time,
                    style: GoogleFonts.spaceGrotesk(fontSize: 10, color: Colors.white38),
                  )
              ],
            ),
            const SizedBox(height: 15),

            // Scoreboard UI layout
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                // Team 1
                Expanded(
                  child: Column(
                    children: [
                      CachedNetworkImage(
                        imageUrl: match.team1Logo,
                        height: 48,
                        width: 48,
                        placeholder: (context, url) => Shimmer.fromColors(
                          baseColor: Colors.grey[900]!,
                          highlightColor: Colors.grey[800]!,
                          child: Container(width: 48, height: 48, color: Colors.black),
                        ),
                        errorWidget: (context, url, error) => const CircleAvatar(
                          backgroundColor: Color(0xFF1E1E2E),
                          child: Icon(Icons.sports_soccer, color: Colors.white54),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        match.team1Name,
                        textAlign: TextAlign.center,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.white),
                      ),
                    ],
                  ),
                ),

                // Center indicator badge
                Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, py: 5),
                      decoration: BoxDecoration(
                        color: isLive ? const Color(0xFF10B981).withOpacity(0.1) : Colors.white.withOpacity(0.03),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        isLive ? 'ভিএস' : 'বনাম',
                        style: GoogleFonts.inter(
                          fontWeight: FontWeight.black,
                          fontSize: 11,
                          color: isLive ? const Color(0xFF10B981) : Colors.white54,
                        ),
                      ),
                    ),
                  ],
                ),

                // Team 2
                Expanded(
                  child: Column(
                    children: [
                      CachedNetworkImage(
                        imageUrl: match.team2Logo,
                        height: 48,
                        width: 48,
                        placeholder: (context, url) => Shimmer.fromColors(
                          baseColor: Colors.grey[900]!,
                          highlightColor: Colors.grey[800]!,
                          child: Container(width: 48, height: 48, color: Colors.black),
                        ),
                        errorWidget: (context, url, error) => const CircleAvatar(
                          backgroundColor: Color(0xFF1E1E2E),
                          child: Icon(Icons.sports_soccer, color: Colors.white54),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        match.team2Name,
                        textAlign: TextAlign.center,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.white),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // TV channel lists widget builder
  Widget _buildChannelsTab() {
    if (_channels.isEmpty) {
      return Center(
        child: Text(
          'কোনো চ্যানেল পাওয়া যায়নি',
          style: GoogleFonts.inter(color: Colors.white38),
        ),
      );
    }

    return GridView.builder(
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.85,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
      ),
      itemCount: _channels.length,
      itemBuilder: (context, index) {
        final ch = _channels[index];
        return GestureDetector(
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => LivePlayerScreen(channel: ch),
              ),
            );
          },
          child: Container(
            decoration: BoxDecoration(
              color: const Color(0xFF0D0D15),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.white.withOpacity(0.04)),
            ),
            padding: const EdgeInsets.all(12),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Expanded(
                  child: Center(
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: CachedNetworkImage(
                        imageUrl: ch.logo,
                        height: 70,
                        width: 70,
                        fit: BoxFit.cover,
                        placeholder: (context, url) => Container(
                          color: Colors.black26,
                          child: const Icon(Icons.tv, color: Colors.white24, size: 30),
                        ),
                        errorWidget: (context, url, error) => Container(
                          color: const Color(0xFF121220),
                          child: const Icon(Icons.tv, color: Colors.white30, size: 30),
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  ch.name,
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.inter(
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, py: 2),
                  decoration: BoxDecoration(
                    color: const Color(0xFF10B981).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    ch.category,
                    style: GoogleFonts.inter(
                      fontSize: 8,
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFF10B981),
                    ),
                  ),
                )
              ],
            ),
          ),
        );
      },
    );
  }
}

// ==========================================
// HIGH PERFORMANCE FAIL-SAFE VIDEO PLAYER SCREEN
// ==========================================
class LivePlayerScreen extends StatefulWidget {
  final ChannelModel channel;

  const LivePlayerScreen({super.key, required this.channel});

  @override
  State<LivePlayerScreen> createState() => _LivePlayerScreenState();
}

class _LivePlayerScreenState extends State<LivePlayerScreen> {
  VideoPlayerController? _videoPlayerController;
  ChewieController? _chewieController;
  int _activeServerIndex = 0;
  List<String> _serverUrls = [];
  bool _isPlayerLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _parseChannelsSources();
  }

  void _parseChannelsSources() {
    // Collect active server stream endpoints
    List<String> links = [];
    if (widget.channel.streamUrl1.trim().startsWith('http')) links.add(widget.channel.streamUrl1);
    if (widget.channel.streamUrl2.trim().startsWith('http')) links.add(widget.channel.streamUrl2);
    if (widget.channel.streamUrl3.trim().startsWith('http')) links.add(widget.channel.streamUrl3);

    // Fallback sandbox stream
    if (links.isEmpty) {
      links.add('https://sample.vodobox.net/skate_phantom_flex_4k/skate_phantom_flex_4k.m3u8');
    }

    _serverUrls = links;
    _initializeIndividualPlayer(_serverUrls[_activeServerIndex]);
  }

  // ExoPlayer Core setup inside VideoPlayer SDK on Android
  Future<void> _initializeIndividualPlayer(String sourceUrl) async {
    setState(() {
      _isPlayerLoading = true;
      _errorMessage = null;
    });

    // Destroy active player configurations cleanly
    _chewieController?.dispose();
    _videoPlayerController?.dispose();

    try {
      // OVERRIDE user agent: bypasses security firewalls and locks standard sport channels correctly
      _videoPlayerController = VideoPlayerController.networkUrl(
        Uri.parse(sourceUrl),
        httpHeaders: const {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36 LiveKhelaAndroidApp/1.0',
        },
      );

      await _videoPlayerController!.initialize();

      // Configure Chewie custom UI layer wrapped over ExoPlayer with buffer adjustments
      _chewieController = ChewieController(
        videoPlayerController: _videoPlayerController!,
        autoPlay: true,
        looping: false,
        isLive: true,
        allowedScreenSleep: false,
        showControls: true,
        useRootNavigator: true,
        aspectRatio: _videoPlayerController!.value.aspectRatio,
        errorBuilder: (context, errorMsg) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, color: Colors.redAccent, size: 40),
                  const SizedBox(height: 10),
                  Text(
                    'চ্যানেল সম্প্রচার সংযোগ হচ্ছে না',
                    style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981)),
                    onPressed: _handlePlayerFailoverSwitch,
                    child: const Text('পরবর্তী সার্ভার চালু করুন', style: TextStyle(color: Colors.black)),
                  )
                ],
              ),
            ),
          );
        },
      );

      setState(() {
        _isPlayerLoading = false;
      });
    } catch (err) {
      debugPrint("Core player init error: $err");
      _handlePlayerFailoverSwitch();
    }
  }

  // Automated load-balancer switching to alternate streaming links
  void _handlePlayerFailoverSwitch() {
    if (_activeServerIndex + 1 < _serverUrls.length) {
      _activeServerIndex++;
      _initializeIndividualPlayer(_serverUrls[_activeServerIndex]);
    } else {
      setState(() {
        _isPlayerLoading = false;
        _errorMessage = "দুঃখিত, কোনো সক্রিয় সম্প্রচার সার্ভার সফলভাবে সংযোগ করা সম্ভব হয়নি।";
      });
    }
  }

  @override
  void dispose() {
    _chewieController?.dispose();
    _videoPlayerController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.channel.name, style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 15)),
        backgroundColor: const Color(0xFF0D0D15),
        elevation: 0,
      ),
      body: Column(
        children: [
          // Aspect-ratio Video Frame Container
          AspectRatio(
            aspectRatio: 16 / 9,
            child: Container(
              color: Colors.black,
              child: _isPlayerLoading
                  ? const Center(child: CircularProgressIndicator(color: Color(0xFF10B981)))
                  : _errorMessage != null
                      ? Center(child: Text(_errorMessage!, style: GoogleFonts.inter(color: Colors.redAccent, fontSize: 12)))
                      : _chewieController != null
                          ? Chewie(controller: _chewieController!)
                          : const Center(child: CircularProgressIndicator(color: Color(0xFF10B981))),
            ),
          ),

          // Multi-server fallbacks UI buttons list
          Expanded(
            child: Container(
              padding: const EdgeInsets.all(20),
              color: const Color(0xFF05050A),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'সার্ভার সংযোগ সমূহ',
                            style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.white),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'বাফারিং বা কালো স্ক্রিন দেখা দিলে সার্ভার পরিবর্তন করুন',
                            style: GoogleFonts.inter(fontSize: 10, color: Colors.white54),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, py: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFF10B981).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          'LOW LATENCY',
                          style: GoogleFonts.spaceGrotesk(fontSize: 8, fontWeight: FontWeight.black, color: const Color(0xFF10B981)),
                        ),
                      )
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Map server indicators
                  Wrap(
                    spacing: 10,
                    children: List.generate(_serverUrls.length, (index) {
                      bool isActive = index == _activeServerIndex;
                      return ChoiceChip(
                        label: Text('সার্ভার ${index + 1}'),
                        selected: isActive,
                        selectedColor: const Color(0xFF10B981),
                        labelStyle: GoogleFonts.spaceGrotesk(
                          fontWeight: FontWeight.bold,
                          color: isActive ? Colors.black : Colors.white70,
                          fontSize: 12,
                        ),
                        backgroundColor: const Color(0xFF0D0D15),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                          side: BorderSide(color: isActive ? const Color(0xFF10B981) : Colors.white.withOpacity(0.05)),
                        ),
                        onSelected: (selected) {
                          if (selected) {
                            setState(() {
                              _activeServerIndex = index;
                            });
                            _initializeIndividualPlayer(_serverUrls[index]);
                          }
                        },
                      );
                    }),
                  ),
                  
                  const SizedBox(height: 30),
                  
                  // Instruction card
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0D0D15),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: Colors.white.withOpacity(0.04)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(FontAwesomeIcons.circleExclamation, color: Color(0xFF10B981), size: 14),
                            const SizedBox(width: 8),
                            Text(
                              'স্মুথ ভিডিও প্লেব্যাক গাইড:',
                              style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.white),
                            )
                          ],
                        ),
                        const SizedBox(height: 10),
                        _buildListItem('১. ভিডিও শুরু হতে কয়েক সেকেন্ড প্লেয়ার বাফারিং হতে পারে।'),
                        _buildListItem('২. কোনো কারণে যদি কালো স্ক্রিন আসে, অন্য সার্ভার ট্রাই করুন।'),
                        _buildListItem('৩. লাইভ স্ট্রিমটি প্লেয়ার থেকে ফুলস্ক্রিন করে উপভোগ করতে পারেন।'),
                      ],
                    ),
                  )
                ],
              ),
            ),
          )
        ],
      ),
    );
  }

  Widget _buildListItem(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Text(
        text,
        style: GoogleFonts.inter(fontSize: 11, color: Colors.white70, height: 1.4),
      ),
    );
  }
}
